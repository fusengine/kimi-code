/**
 * harness-config.ts — Harness configuration step (parity with the Claude
 * installer): wires FUSE_HARNESS_REFS (every solid-STAR references dir, so the
 * harness solid-read gate resolves refs under Kimi) and proposes opt-in
 * tuning knobs interactively (tuning-prompt.ts), persisted to $KIMI_HOME/.env.
 */
import { join } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import type { InstallContext, InstallStepResult } from "../../../src/interfaces/index.ts";
import { resolutionEnv } from "./env-file";
import { upsertEnvVars } from "./env-write";
import { KNOBS, promptKnobs } from "./tuning-prompt";
import { info, plan } from "./ui";

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
			const env = await resolutionEnv(ctx);
			Object.assign(vars, await promptKnobs(env));
		}
		await upsertEnvVars(ctx, vars);
		res.notes.push(`refs: ${dirs.length} dirs, tuned: ${Object.keys(vars).length - (dirs.length > 0 ? 1 : 0)}`);
		info(`harness config → ${Object.keys(vars).length} var(s) in .env`);
	}
	return res;
}
