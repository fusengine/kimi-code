/**
 * agents-install.ts — Materialize agents into $KIMI_HOME/agents/ (flat).
 * Managed plugin copy → SYMLINKS (live-updated by /plugins install); plain
 * clone → copies. Pre-existing files we do not own are never touched; owned
 * entries whose source vanished are removed (dangling symlinks).
 */
import { mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readJsonSafe } from "../fs-exists";
import type { InstallContext, InstallStepResult } from "../../../src/interfaces/index.ts";
import { computeTargets, place, sourceRoot } from "./agents-targets";
import { detail, info, plan, warn } from "./ui";

/** Materialize agent files into $KIMI_HOME/agents/. */
export async function installAgents(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "installAgents", status: "ok", notes: [] };
	const { root, managed } = sourceRoot(ctx);
	const targets = await computeTargets(root);
	if (targets.length === 0) {
		res.status = "skip";
		res.notes.push("no agents found");
		return res;
	}
	const destDir = join(ctx.kimiHome, "agents");
	const trackPath = join(ctx.kimiHome, ".fusengine-agents.json");
	const owned: string[] = (await readJsonSafe<string[]>(trackPath)) ?? [];
	const wanted = new Set(targets.map((t) => t.destName));
	if (ctx.dryRun) {
		plan(`${managed ? "symlink" : "copy"} ${targets.length} agent file(s) → ${destDir}/`);
		for (const t of targets) detail(ctx.verbose, `${t.src} → ${t.destName}`);
		res.notes.push(`${targets.length} file(s), mode: ${managed ? "symlink" : "copy"}`);
		return res;
	}
	await mkdir(destDir, { recursive: true });
	for (const t of targets) {
		const dest = join(destDir, t.destName);
		if (existsSync(dest) && !owned.includes(t.destName)) {
			warn(`${dest} exists and is not ours — leaving it untouched`);
			continue;
		}
		await place(t, destDir, managed);
	}
	for (const stale of owned.filter((n) => !wanted.has(n))) {
		const p = join(destDir, stale);
		if (existsSync(p)) await unlink(p);
	}
	await Bun.write(trackPath, `${JSON.stringify([...wanted].sort(), null, 2)}\n`);
	info(`${targets.length} agent(s) ${managed ? "symlinked" : "copied"} → ${destDir}/`);
	res.notes.push(`${targets.length} file(s), mode: ${managed ? "symlink" : "copy"}`);
	return res;
}
