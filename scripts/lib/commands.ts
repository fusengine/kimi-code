import { join } from "node:path";
import { cp, mkdir, readdir } from "node:fs/promises";
import type { ConverterResult } from "./types";

/**
 * Preserve every <plugin>/commands/*.md as a Kimi plugin command.
 * Kimi plugin commands use the same $ARGUMENTS convention and
 * `description` frontmatter as Claude, so files are copied verbatim.
 */
export async function transformCommands(
	srcDir: string,
	destDir: string,
): Promise<ConverterResult> {
	const errors: string[] = [];
	const srcCommands = join(srcDir, "commands");
	let entries: string[];
	try {
		entries = await readdir(srcCommands);
	} catch {
		return { converted: 0, errors };
	}

	let converted = 0;
	for (const entry of entries) {
		if (!entry.endsWith(".md")) continue;
		const srcFile = join(srcCommands, entry);
		try {
			const destCommands = join(destDir, "commands");
			await mkdir(destCommands, { recursive: true });
			await cp(srcFile, join(destCommands, entry));
			converted++;
		} catch (e) {
			errors.push(`commands/${entry}: ${(e as Error).message}`);
		}
	}
	return { converted, errors };
}
