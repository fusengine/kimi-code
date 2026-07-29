/**
 * plugin-catalog.ts — List plugin dirs carrying a valid kimi.plugin.json.
 * Shared by marketplace generation, agent install and the MCP scan so all
 * steps agree on the plugin set and on manifest names (dir ≠ name often).
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readJsonSafe } from "../fs-exists";
import type { KimiManifest, PluginCatalogEntry } from "../../../src/interfaces/index.ts";

/** Read one plugin's manifest; null when absent or unparsable. */
async function readEntry(pluginsRoot: string, dir: string): Promise<PluginCatalogEntry | null> {
	const manifest = await readJsonSafe<KimiManifest>(join(pluginsRoot, dir, "kimi.plugin.json"));
	if (!manifest?.name) return null;
	const iface = manifest.interface ?? {};
	const display = typeof iface.displayName === "string" ? iface.displayName : manifest.name;
	return { dir, name: manifest.name, displayName: display };
}

/** List all valid plugins, sorted by manifest name for deterministic output. */
export async function listPlugins(pluginsRoot: string): Promise<PluginCatalogEntry[]> {
	let dirs: string[] = [];
	try {
		dirs = (await readdir(pluginsRoot, { withFileTypes: true }))
			.filter((e) => e.isDirectory() && !e.name.startsWith("."))
			.map((e) => e.name);
	} catch {
		return [];
	}
	const entries = await Promise.all(dirs.map((d) => readEntry(pluginsRoot, d)));
	return entries
		.filter((e): e is PluginCatalogEntry => e !== null)
		.sort((a, b) => a.name.localeCompare(b.name));
}
