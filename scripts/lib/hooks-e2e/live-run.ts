/**
 * live-run.ts — Layer 3 execution: run hook rules through each plugin's real
 * shim against the staged real harness. Native kimi contract: exit ∈ {0, 2}
 * and stdout empty, parseable JSON, OR plain text (context injection) without
 * a crash signature. Tallies: ok (exit 0, output), silent, deny.
 */
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { HookRuleRef, LivePluginReport, ShimRun } from "../../../src/interfaces/index.ts";
import { parseShimCommand, shimPath } from "./collect";
import { synthesizePayload } from "./payload";

/** One live shim invocation with a synthesized (or overridden) payload object. */
export function runLiveRule(
	pluginsRoot: string,
	cacheDir: string,
	ref: HookRuleRef,
	payload: Record<string, unknown>,
): ShimRun {
	const cmd = parseShimCommand(ref.hook.command);
	const args = cmd ? [cmd.scope, ...cmd.args] : [];
	const proc = spawnSync("bun", [shimPath(pluginsRoot, ref.pluginDir), ...args], {
		input: JSON.stringify(payload),
		env: {
			...(process.env as Record<string, string>),
			KIMI_CODE_HOME: cacheDir,
			KIMI_PLUGIN_ROOT: join(pluginsRoot, ref.pluginDir),
		},
		encoding: "utf8",
	});
	return { code: proc.status ?? 1, stdout: proc.stdout ?? "", stderr: proc.stderr ?? "" };
}

/** permissionDecision: deny at top level or under hookSpecificOutput. */
export function isDeny(parsed: Record<string, unknown>): boolean {
	const inner = parsed.hookSpecificOutput as { permissionDecision?: string } | undefined;
	return parsed.permissionDecision === "deny" || inner?.permissionDecision === "deny";
}

/** additionalContext when stdout is a JSON envelope, else the raw text itself. */
export function additionalContextOrText(stdout: string): string {
	let p: { hookSpecificOutput?: { additionalContext?: string } } | null = null;
	try { p = JSON.parse(stdout); } catch { /* plain text: native kimi contract */ }
	return p?.hookSpecificOutput?.additionalContext ?? stdout;
}

/** Crash signature: an "error:"-prefixed line or a V8 stack frame. */
function looksLikeCrash(text: string): boolean {
	return /^\w*error:/im.test(text) || /^\s+at\s+[\w$.]+\s+\([^)]+:\d+:\d+\)/m.test(text);
}

/** Classify one live run; returns a violation string or the tally bucket. */
function classify(ref: HookRuleRef, run: ShimRun): "ok" | "deny" | "silent" | string {
	const tag = `${ref.pluginDir} [${ref.hook.event} ${ref.hook.matcher}]`;
	if (run.code !== 0 && run.code !== 2) return `${tag}: exit ${run.code} (${run.stderr.slice(0, 120)})`;
	const out = run.stdout.trim();
	if (!out) return run.code === 2 ? "deny" : "silent";
	try {
		if (isDeny(JSON.parse(out) as Record<string, unknown>)) return "deny";
	} catch {
		if (looksLikeCrash(out)) return `${tag}: crash-like stdout: ${out.slice(0, 120)}`;
	}
	return run.code === 2 ? "deny" : "ok";
}

/** Run every rule of every plugin; prints one report line per plugin. */
export function liveSweep(
	pluginsRoot: string,
	cacheDir: string,
	rules: HookRuleRef[],
): LivePluginReport[] {
	const byPlugin = new Map<string, LivePluginReport>();
	for (const ref of rules) {
		const report = byPlugin.get(ref.pluginDir) ?? {
			plugin: ref.pluginDir, ok: 0, deny: 0, silent: 0, violations: [],
		};
		byPlugin.set(ref.pluginDir, report);
		const verdict = classify(ref, runLiveRule(pluginsRoot, cacheDir, ref, synthesizePayload(ref)));
		if (verdict === "ok" || verdict === "deny" || verdict === "silent") report[verdict]++;
		else report.violations.push(verdict);
	}
	const reports = [...byPlugin.values()].sort((a, b) => a.plugin.localeCompare(b.plugin));
	for (const r of reports) {
		const bad = r.violations.length > 0 ? ` VIOLATIONS=${r.violations.length}` : "";
		console.log(`  live ${r.plugin.padEnd(22)} ok=${r.ok} deny=${r.deny} silent=${r.silent}${bad}`);
	}
	return reports;
}
