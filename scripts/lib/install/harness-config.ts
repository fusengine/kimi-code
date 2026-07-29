/**
 * harness-config.ts — Harness configuration step (parity with the Claude
 * installer): wires FUSE_HARNESS_REFS (every solid-STAR references dir, so the
 * harness solid-read gate resolves refs under Kimi) and proposes opt-in
 * tuning knobs interactively, persisted to $KIMI_HOME/.env.
 */
import { join } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import type { InstallContext, InstallStepResult } from "../../../src/interfaces/index.ts";
import { resolutionEnv } from "./env-file";
import { nextPipedLine } from "./stdin-lines";
import { upsertEnvVars } from "./env-write";
import { info, plan } from "./ui";

interface Knob { key: string; label: string; def: string }

const KNOBS: readonly Knob[] = [
	{ key: "FUSE_SOLID_MAX_LINES", label: "SOLID max lines per file", def: "100" },
	{ key: "FUSE_ENFORCE_TTL_SEC", label: "APEX/SOLID enforcement TTL (sec)", def: "120" },
	{ key: "FUSE_LESSONS_THROTTLE_MIN", label: "Lessons reminder throttle (min)", def: "5" },
	{ key: "FUSE_MCP_TTL_SEC", label: "Cached MCP doc freshness (sec)", def: "172800" },
	{ key: "FUSE_WEBFETCH_TTL_SEC", label: "Web fetch cache freshness (sec)", def: "86400" },
	{ key: "FUSENGINE_CACHE_TTL_MIN", label: "Subagent context cache TTL (min)", def: "30" },
];

/** Root whose plugins tree actually runs live: managed copy if present, else repo. */
function livePluginsRoot(ctx: InstallContext): string {
	const managed = join(ctx.kimiHome, "plugins", "managed", "fusengine", "plugins");
	return existsSync(managed) ? managed : ctx.pluginsRoot;
}

/** Every plugins/<dir>/skills/solid-STAR/references dir, for FUSE_HARNESS_REFS. */
export function refsDirs(ctx: InstallContext): string[] {
	const root = livePluginsRoot(ctx);
	const out: string[] = [];
	for (const plugin of readdirSync(root, { withFileTypes: true })) {
		if (!plugin.isDirectory()) continue;
		const skills = join(root, plugin.name, "skills");
		if (!existsSync(skills)) continue;
		for (const s of readdirSync(skills, { withFileTypes: true })) {
			if (s.isDirectory() && s.name.startsWith("solid-") && existsSync(join(skills, s.name, "references"))) {
				out.push(join(skills, s.name, "references"));
			}
		}
	}
	return out.sort();
}

/** TTY: readline; piped: shared stdin buffer (same EOF trap as key prompts). */
async function asker(): Promise<(q: string) => Promise<string>> {
	if (process.stdin.isTTY) {
		const rl = createInterface({ input: process.stdin, output: process.stdout });
		return async (q) => rl.question(q);
	}
	return async (q) => { process.stdout.write(q); return nextPipedLine(); };
}

/** Wire FUSE_HARNESS_REFS always; propose tuning knobs when interactive. */
export async function configureHarness(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "configureHarness", status: "ok", notes: [] };
	const dirs = refsDirs(ctx);
	const vars: Record<string, string> = dirs.length > 0 ? { FUSE_HARNESS_REFS: dirs.join(":") } : {};
	const interactive = process.stdin.isTTY || process.env.FUSENGINE_FORCE_PROMPT === "1";
	if (ctx.dryRun) {
		plan(`set FUSE_HARNESS_REFS (${dirs.length} refs dirs) + propose ${KNOBS.length} tuning knobs`);
		res.notes.push(`refs: ${dirs.length} dirs`);
	} else {
		if (interactive) {
			const ask = await asker();
			const env = await resolutionEnv(ctx);
			const wants = (await ask("Configure advanced harness tuning? [y/N] ")).trim().toLowerCase();
			if (wants === "y" || wants === "yes") {
				for (const k of KNOBS) {
					const current = env[k.key] ?? k.def;
					const v = (await ask(`${k.label} [${current}]: `)).trim() || current;
					if (v !== k.def) vars[k.key] = v;
				}
			}
		}
		await upsertEnvVars(ctx, vars);
		res.notes.push(`refs: ${dirs.length} dirs, tuned: ${Object.keys(vars).length - (dirs.length > 0 ? 1 : 0)}`);
		info(`harness config → ${Object.keys(vars).length} var(s) in .env`);
	}
	return res;
}
