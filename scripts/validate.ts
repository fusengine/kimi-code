#!/usr/bin/env bun
/**
 * validate.ts — Conformance check over kimi-code/plugins/.
 * Asserts manifest shape (name regex, declared paths, Kimi hook events,
 * shim commands) and markdown frontmatter (SKILL.md, agents, commands).
 * Prints a per-plugin table; exits 1 on any failure.
 */
import { join } from "node:path";
import { readdir } from "node:fs/promises";
import { exists } from "./lib/fs-exists";
import { checkManifest, checkMarkdown } from "./lib/validate-checks";

const ROOT = join(import.meta.dir, "..", "plugins");

type Row = {
	plugin: string;
	hooks: number;
	skills: number;
	agents: number;
	commands: number;
	issues: string[];
};

async function countMd(dir: string): Promise<number> {
	try {
		return (await readdir(dir)).filter((f) => f.endsWith(".md")).length;
	} catch {
		return 0;
	}
}

async function countSkills(dir: string): Promise<number> {
	try {
		let n = 0;
		for (const e of await readdir(dir, { withFileTypes: true })) {
			if (e.isDirectory() && (await exists(join(dir, e.name, "SKILL.md")))) n++;
		}
		return n;
	} catch {
		return 0;
	}
}

async function checkPlugin(dir: string, name: string): Promise<Row> {
	const issues = [...(await checkManifest(dir)), ...(await checkMarkdown(dir))];
	let hooks = 0;
	try {
		hooks = ((await Bun.file(join(dir, "kimi.plugin.json")).json()).hooks ?? []).length;
	} catch { /* reported by checkManifest */ }
	return {
		plugin: name,
		hooks,
		skills: await countSkills(join(dir, "skills")),
		agents: await countMd(join(dir, "agents")),
		commands: await countMd(join(dir, "commands")),
		issues,
	};
}

async function main(): Promise<void> {
	const rows: Row[] = [];
	for (const e of await readdir(ROOT, { withFileTypes: true })) {
		if (!e.isDirectory()) continue;
		if (!(await exists(join(ROOT, e.name, "kimi.plugin.json")))) continue;
		rows.push(await checkPlugin(join(ROOT, e.name), e.name));
	}
	rows.sort((a, b) => a.plugin.localeCompare(b.plugin));

	console.log("plugin                 hooks skills agents commands status");
	console.log("--------------------- ----- ------ ------ -------- ------");
	for (const r of rows) {
		const status = r.issues.length === 0 ? "OK" : "FAIL";
		console.log(
			`${r.plugin.padEnd(21)} ${String(r.hooks).padStart(5)} ${String(r.skills).padStart(6)} ${String(r.agents).padStart(6)} ${String(r.commands).padStart(8)} ${status}`,
		);
		for (const issue of r.issues) console.log(`  ✖ ${issue}`);
	}
	const failed = rows.filter((r) => r.issues.length > 0);
	console.log(`\n${rows.length - failed.length}/${rows.length} plugins valid.`);
	if (failed.length > 0) process.exit(1);
}

if (import.meta.main) await main();
