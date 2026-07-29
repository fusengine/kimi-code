import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { ConverterResult } from "./types";
import { exists } from "./fs-exists";

const PASSTHROUGH_DIRS = [
	"rules",
	"templates",
	"docs",
	"scripts",
	".cartographer",
	"statusline",
	"song",
] as const;

const PASSTHROUGH_FILES = ["mcp.json.bak", "README.md"] as const;

const EXCLUDED = new Set(["node_modules", "dist", "_archive", ".DS_Store", ".harness"]);

/** fs.cp filter: apply the exclusion list at every depth, not just top level. */
export function passthroughFilter(src: string): boolean {
	return !EXCLUDED.has(src.split("/").pop() ?? "");
}

/**
 * Copy plugin content Kimi consumes (or the installer reads) unmodified.
 * node_modules/, _archive/, dist/ and .DS_Store are never whitelisted.
 */
export async function copyPassthrough(
	srcDir: string,
	destDir: string,
): Promise<ConverterResult> {
	const errors: string[] = [];
	let converted = 0;
	await mkdir(destDir, { recursive: true });
	for (const name of [...PASSTHROUGH_DIRS, ...PASSTHROUGH_FILES]) {
		const srcPath = join(srcDir, name);
		if (!(await exists(srcPath))) continue;
		try {
			await cp(srcPath, join(destDir, name), {
				recursive: true,
				filter: passthroughFilter,
			});
			converted++;
		} catch (err) {
			errors.push(`copy ${name}: ${(err as Error).message}`);
		}
	}
	return { converted, errors };
}
