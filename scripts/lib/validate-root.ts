/** validate-root.ts — Conformance checks for the root .kimi-plugin/plugin.json. */
import { join } from "node:path";
import { exists } from "./fs-exists";

const EVENTS = new Set([
	"UserPromptSubmit", "PreToolUse", "Stop", "PostToolUse", "PostToolUseFailure",
	"PermissionRequest", "PermissionResult", "SessionStart", "SessionEnd",
	"SubagentStart", "SubagentStop", "StopFailure", "Interrupt", "PreCompact",
	"PostCompact", "Notification",
]);

interface RootManifest {
	name?: string;
	skills?: string | string[];
	commands?: string | string[];
	hooks?: Array<{ event: string; command: string }>;
}

/** Validate the aggregated root manifest; returns issue strings ([] = valid). */
export async function checkRootManifest(repoRoot: string, pluginHookTotal: number): Promise<string[]> {
	const issues: string[] = [];
	const path = join(repoRoot, ".kimi-plugin", "plugin.json");
	if (!(await exists(path))) return [".kimi-plugin/plugin.json missing — run scripts/build-root-manifest.ts"];
	let m: RootManifest;
	try {
		m = await Bun.file(path).json();
	} catch {
		return [".kimi-plugin/plugin.json: invalid JSON"];
	}
	if (!m.name || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(m.name)) issues.push(`root name invalid: ${m.name}`);
	const paths = [m.skills ?? [], m.commands ?? []].flat();
	for (const p of paths) {
		if (!p.startsWith("./")) issues.push(`path not ./-relative: ${p}`);
		else if (!(await exists(join(repoRoot, p)))) issues.push(`declared path missing: ${p}`);
	}
	for (const h of m.hooks ?? []) {
		if (!EVENTS.has(h.event)) issues.push(`hook event not Kimi-native: ${h.event}`);
		if (!h.command.includes("kimi-hook-shim.mjs")) issues.push(`hook command without shim: ${h.command}`);
	}
	if ((m.hooks ?? []).length !== pluginHookTotal) {
		issues.push(`root hooks ${(m.hooks ?? []).length} != plugin hooks total ${pluginHookTotal} — regenerate`);
	}
	return issues;
}
