import { join } from "node:path";
import type { ClaudeManifest, ConverterResult, KimiManifest } from "./types";
import { exists, readJsonSafe } from "./fs-exists";
import { buildInterface } from "./manifest-interface";

export async function transformManifest(
	srcDir: string,
	destDir: string,
): Promise<ConverterResult> {
	const errors: string[] = [];
	const srcPath = join(srcDir, ".claude-plugin", "plugin.json");
	const source = await readJsonSafe<ClaudeManifest>(srcPath);
	if (!source) {
		errors.push(`missing source manifest at ${srcPath}`);
		return { converted: 0, errors };
	}

	const name = source.name ?? "";
	if (!name) {
		errors.push("manifest has no name");
		return { converted: 0, errors };
	}

	const manifest: KimiManifest = {
		name,
		version: source.version ?? "0.0.0",
		description: source.description ?? "",
		author: source.author,
		repository: source.repository,
		homepage: source.homepage,
		license: source.license ?? "MIT",
		keywords: source.keywords ?? [],
		// Declared only when the plugin ships the matching directory.
		...(await exists(join(srcDir, "skills")) ? { skills: "./skills/" } : {}),
		...(await exists(join(srcDir, "commands")) ? { commands: "./commands/" } : {}),
		// MCP servers are NOT declared in the plugin manifest: they are
		// centralized by the installer. Per-plugin definitions live in
		// mcp.json.bak, read by the installer.
		// hooks: attached by the hooks step (flat array in this same file).
		interface: buildInterface(source, name),
	};

	const out = join(destDir, "kimi.plugin.json");
	try {
		await Bun.write(out, JSON.stringify(manifest, null, 2) + "\n");
		return { converted: 1, errors };
	} catch (err) {
		errors.push(`write failed: ${(err as Error).message}`);
		return { converted: 0, errors };
	}
}
