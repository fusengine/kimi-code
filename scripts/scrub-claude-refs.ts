#!/usr/bin/env bun
/**
 * scrub-claude-refs.ts — Global rename Claude → Kimi across kimi-code/plugins/.
 * Skips: node_modules, .git, migration-report.json, scrub-report.json,
 * lockfiles, binary files. Writes plugins/scrub-report.json with the
 * touched files. Lines holding shim/harness compatibility strings are
 * left untouched (see lib/scrub-rules.ts).
 */
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { applyRules } from "./lib/scrub-rules";

const ROOT = join(import.meta.dir, "..", "plugins");
const SKIP_DIRS = new Set(["node_modules", ".git"]);
const SKIP_FILES = new Set([
	"migration-report.json",
	"scrub-report.json",
	"bun.lock",
	"bun.lockb",
	"package-lock.json",
	"yarn.lock",
	"pnpm-lock.yaml",
]);
const TEXT_EXT = new Set([
	".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md",
	".toml", ".yaml", ".yml", ".sh", ".html", ".txt",
]);

async function walk(dir: string, out: string[] = []): Promise<string[]> {
	for (const e of await readdir(dir, { withFileTypes: true })) {
		if (e.isDirectory()) {
			if (SKIP_DIRS.has(e.name)) continue;
			await walk(join(dir, e.name), out);
		} else if (e.isFile() && !SKIP_FILES.has(e.name)) {
			const ext = e.name.slice(e.name.lastIndexOf("."));
			if (TEXT_EXT.has(ext) || !ext.includes(".")) out.push(join(dir, e.name));
		}
	}
	return out;
}

async function main() {
	const files = await walk(ROOT);
	const touched: { path: string; replacements: number }[] = [];
	for (const f of files) {
		const before = await Bun.file(f).text();
		const { content, count } = applyRules(before);
		if (count > 0) {
			await Bun.write(f, content);
			touched.push({ path: relative(ROOT, f), replacements: count });
		}
	}
	const total = touched.reduce((s, t) => s + t.replacements, 0);
	console.log(`Scrubbed ${touched.length} files (${total} replacements).`);
	await Bun.write(
		join(ROOT, "scrub-report.json"),
		JSON.stringify({ touched }, null, 2),
	);
}

if (import.meta.main) await main();
