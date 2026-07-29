import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export type {
	ClaudeManifest,
	ConverterResult,
	KimiHook,
	KimiManifest,
	ManifestAuthor,
	MigrationReport,
	PluginReport,
	StepResult,
} from "../../src/interfaces/index.ts";

export function discoverPlugins(srcRoot: string): string[] {
	try {
		return readdirSync(srcRoot)
			.filter((n) => !n.startsWith("."))
			.filter((n) => {
				try {
					return statSync(join(srcRoot, n)).isDirectory();
				} catch {
					return false;
				}
			});
	} catch {
		return [];
	}
}
