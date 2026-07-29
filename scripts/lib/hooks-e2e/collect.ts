/**
 * collect.ts — Gather every hook rule declared in plugins/<dir>/kimi.plugin.json,
 * bound to its plugin, and parse the shim invocation out of each command.
 * Shared by all three hooks-e2e layers so they iterate the exact same rule set.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readJsonSafe } from "../fs-exists";
import type { HookRuleRef, KimiManifest, ShimCommand } from "../../../src/interfaces/index.ts";

const SHIM_RE = /^bun\s+"?\$\{KIMI_PLUGIN_ROOT\}\/scripts\/kimi-hook-shim\.mjs"?\s+(\S+)(.*)$/;

/** Parse `bun "${KIMI_PLUGIN_ROOT}/scripts/kimi-hook-shim.mjs" <scope> [args]`; null when off-pattern. */
export function parseShimCommand(command: string): ShimCommand | null {
	const m = command.trim().match(SHIM_RE);
	if (!m) return null;
	return { scope: m[1], args: m[2].trim().split(/\s+/).filter(Boolean) };
}

/** All hook rules across plugins with a valid manifest, sorted by dir then event. */
export async function collectHookRules(pluginsRoot: string): Promise<HookRuleRef[]> {
	const out: HookRuleRef[] = [];
	let dirs: string[] = [];
	try {
		dirs = (await readdir(pluginsRoot, { withFileTypes: true }))
			.filter((e) => e.isDirectory() && !e.name.startsWith("."))
			.map((e) => e.name);
	} catch {
		return [];
	}
	for (const dir of dirs) {
		const manifest = await readJsonSafe<KimiManifest>(join(pluginsRoot, dir, "kimi.plugin.json"));
		if (!manifest?.name) continue;
		for (const hook of manifest.hooks ?? []) {
			out.push({ pluginDir: dir, pluginName: manifest.name, hook });
		}
	}
	return out.sort(
		(a, b) => a.pluginDir.localeCompare(b.pluginDir) || a.hook.event.localeCompare(b.hook.event),
	);
}

/** Absolute path of a plugin's on-disk shim (guaranteed by the static layer). */
export function shimPath(pluginsRoot: string, pluginDir: string): string {
	return join(pluginsRoot, pluginDir, "scripts", "kimi-hook-shim.mjs");
}
