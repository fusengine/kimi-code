/**
 * agents-targets.ts — Compute agent materialization targets and place them.
 * Source: the managed plugin copy when installed (live symlinks), else the
 * repo's plugins dir (plain copies).
 */
import { readdir } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { symlink, unlink } from "node:fs/promises";
import { exists } from "../fs-exists";
import type { InstallContext } from "../../../src/interfaces/index.ts";
import { listPlugins } from "./plugin-catalog";
import { warn } from "./ui";

export type Target = { src: string; destName: string };

/** Managed plugin copy when it holds ≥1 real plugin (manifest present), else the repo's plugins dir. */
export function sourceRoot(ctx: InstallContext): { root: string; managed: boolean } {
	const managed = join(ctx.kimiHome, "plugins", "managed", "fusengine", "plugins");
	const hasPlugins = existsSync(managed)
		&& readdirSync(managed).some((d) => existsSync(join(managed, d, "kimi.plugin.json")));
	return hasPlugins ? { root: managed, managed: true } : { root: ctx.pluginsRoot, managed: false };
}

/** Flat install targets; colliding basenames get a manifest prefix. */
export async function computeTargets(root: string): Promise<Target[]> {
	const byBase = new Map<string, { src: string; manifest: string }[]>();
	for (const plugin of await listPlugins(root)) {
		const agentsDir = join(root, plugin.dir, "agents");
		if (!(await exists(agentsDir))) continue;
		for (const f of (await readdir(agentsDir)).filter((f) => f.endsWith(".md")).sort()) {
			byBase.set(f, [...(byBase.get(f) ?? []), { src: join(agentsDir, f), manifest: plugin.name }]);
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

/** Place one target: symlink from the managed copy, plain copy otherwise. */
export async function place(t: Target, destDir: string, managed: boolean): Promise<void> {
	const dest = join(destDir, t.destName);
	if (existsSync(dest)) await unlink(dest);
	if (managed) await symlink(t.src, dest);
	else await Bun.write(dest, Bun.file(t.src));
}
