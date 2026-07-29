/**
 * agents-install.ts — Copy plugins/<dir>/agents/*.md into $KIMI_HOME/agents/
 * (flat). On a basename collision across plugins the file is prefixed with
 * the manifest name (`fuse-seo--audit.md`) and a warning is printed. Files we
 * installed (tracked in .fusengine-agents.json) are overwritten; any other
 * pre-existing file at a target path is left untouched with a warning.
 */
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { exists, readJsonSafe } from "../fs-exists";
import type { InstallContext, InstallStepResult } from "../../../src/interfaces/index.ts";
import { listPlugins } from "./plugin-catalog";
import { detail, info, plan, warn } from "./ui";

type Target = { src: string; destName: string };

/** Compute flat install targets; colliding basenames get a manifest prefix. */
async function computeTargets(ctx: InstallContext): Promise<Target[]> {
	const byBase = new Map<string, { src: string; manifest: string }[]>();
	for (const plugin of await listPlugins(ctx.pluginsRoot)) {
		const agentsDir = join(ctx.pluginsRoot, plugin.dir, "agents");
		if (!(await exists(agentsDir))) continue;
		for (const f of (await readdir(agentsDir)).filter((f) => f.endsWith(".md")).sort()) {
			const list = byBase.get(f) ?? [];
			list.push({ src: join(agentsDir, f), manifest: plugin.name });
			byBase.set(f, list);
		}
	}
	const targets: Target[] = [];
	for (const [base, claimants] of byBase) {
		for (const c of claimants) {
			if (claimants.length > 1) warn(`agent name collision on '${base}' → ${c.manifest}--${base}`);
			targets.push({ src: c.src, destName: claimants.length > 1 ? `${c.manifest}--${base}` : base });
		}
	}
	return targets;
}

function trackPath(ctx: InstallContext): string {
	return join(ctx.kimiHome, ".fusengine-agents.json");
}

/** Materialize agent files into $KIMI_HOME/agents/. */
export async function installAgents(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "installAgents", status: "ok", notes: [] };
	const targets = await computeTargets(ctx);
	if (targets.length === 0) {
		res.status = "skip";
		res.notes.push("no agents found");
		return res;
	}
	const destDir = join(ctx.kimiHome, "agents");
	const owned: string[] = (await readJsonSafe<string[]>(trackPath(ctx))) ?? [];
	const writable: Target[] = [];
	for (const t of targets) {
		const dest = join(destDir, t.destName);
		if (!ctx.dryRun && (await exists(dest)) && !owned.includes(t.destName)) {
			warn(`${dest} exists and is not ours — leaving it untouched`);
			continue;
		}
		writable.push(t);
	}
	if (ctx.dryRun) {
		plan(`copy ${targets.length} agent file(s) → ${destDir}/`);
		for (const t of targets) detail(ctx.verbose, `${t.src} → ${t.destName}`);
		res.notes.push(`${targets.length} file(s)`);
		return res;
	}
	await mkdir(destDir, { recursive: true });
	for (const t of writable) await Bun.write(join(destDir, t.destName), Bun.file(t.src));
	await Bun.write(trackPath(ctx), `${JSON.stringify(writable.map((t) => t.destName).sort(), null, 2)}\n`);
	info(`${writable.length} agent file(s) installed → ${destDir}/`);
	res.notes.push(`${writable.length} file(s)`);
	return res;
}
