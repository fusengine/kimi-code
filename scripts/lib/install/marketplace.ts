/**
 * marketplace.ts — Generate <repoRoot>/marketplace.json from all plugin
 * manifests: {version:"2", plugins:[{id, displayName, source}]}, sorted by
 * id. This file is an in-repo artifact, so it is written even in dry-run.
 */
import { join } from "node:path";
import type { InstallContext, InstallStepResult, MarketplaceFile } from "../../../src/interfaces/index.ts";
import { listPlugins } from "./plugin-catalog";
import { info } from "./ui";

export const MARKETPLACE_VERSION = "2";

/** Build the marketplace document from the plugin catalog. */
export async function buildMarketplace(ctx: InstallContext): Promise<MarketplaceFile> {
	const plugins = (await listPlugins(ctx.pluginsRoot)).map((p) => ({
		id: p.name,
		displayName: p.displayName,
		source: `./plugins/${p.dir}`,
	}));
	return { version: MARKETPLACE_VERSION, plugins };
}

/** Write marketplace.json at the repo root; returns it for the summary. */
export async function writeMarketplace(
	ctx: InstallContext,
): Promise<{ res: InstallStepResult; file: MarketplaceFile; path: string }> {
	const res: InstallStepResult = { name: "writeMarketplace", status: "ok", notes: [] };
	const path = join(ctx.repoRoot, "marketplace.json");
	const file = await buildMarketplace(ctx);
	await Bun.write(path, `${JSON.stringify(file, null, 2)}\n`);
	info(`marketplace.json written (${file.plugins.length} plugins) → ${path}`);
	res.notes.push(`${file.plugins.length} plugin(s)`);
	return { res, file, path };
}
