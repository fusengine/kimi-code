import { join } from "node:path";
import { readdir } from "node:fs/promises";
import { exists, readJsonSafe } from "./fs-exists";
import { parseFrontmatter } from "./yaml";
import type { KimiManifest } from "./types";

export const KIMI_EVENTS = new Set([
	"UserPromptSubmit", "PreToolUse", "Stop", "PostToolUse", "PostToolUseFailure",
	"PermissionRequest", "PermissionResult", "SessionStart", "SessionEnd",
	"SubagentStart", "SubagentStop", "StopFailure", "Interrupt",
	"PreCompact", "PostCompact", "Notification",
]);

const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export async function checkManifest(dir: string): Promise<string[]> {
	const issues: string[] = [];
	const path = join(dir, "kimi.plugin.json");
	const manifest = await readJsonSafe<KimiManifest>(path);
	if (!manifest) return [`kimi.plugin.json: missing or invalid JSON`];
	if (!manifest.name || !NAME_RE.test(manifest.name)) {
		issues.push(`kimi.plugin.json: name '${manifest.name}' fails Kimi name regex`);
	}
	if (manifest.skills && !(await exists(join(dir, manifest.skills)))) {
		issues.push(`kimi.plugin.json: skills path '${manifest.skills}' does not exist`);
	}
	if (manifest.commands && !(await exists(join(dir, manifest.commands)))) {
		issues.push(`kimi.plugin.json: commands path '${manifest.commands}' does not exist`);
	}
	for (const [i, hook] of (manifest.hooks ?? []).entries()) {
		if (!KIMI_EVENTS.has(hook.event)) {
			issues.push(`hooks[${i}]: event '${hook.event}' not in Kimi event enum`);
		}
		if (!hook.command?.includes("kimi-hook-shim.mjs")) {
			issues.push(`hooks[${i}]: command does not invoke kimi-hook-shim.mjs`);
		}
	}
	return issues;
}

async function listMd(dir: string): Promise<string[]> {
	try {
		return (await readdir(dir)).filter((f) => f.endsWith(".md"));
	} catch {
		return [];
	}
}

async function checkFrontmatter(
	file: string,
	requireDescription: boolean,
): Promise<string | null> {
	const raw = await Bun.file(file).text();
	if (!raw.startsWith("---")) return `no YAML frontmatter block`;
	const fm = parseFrontmatter(raw);
	if (Object.keys(fm.data).length === 0) return `frontmatter not parseable`;
	if (requireDescription && !fm.data.description) return `missing 'description'`;
	return null;
}

export async function checkMarkdown(dir: string): Promise<string[]> {
	const issues: string[] = [];
	const skillsRoot = join(dir, "skills");
	if (await exists(skillsRoot)) {
		for (const entry of await readdir(skillsRoot)) {
			const skillFile = join(skillsRoot, entry, "SKILL.md");
			if (!(await exists(skillFile))) continue;
			const raw = await Bun.file(skillFile).text();
			const fm = parseFrontmatter(raw);
			if (!fm.data.name || !fm.data.description) {
				issues.push(`skills/${entry}/SKILL.md: needs name + description`);
			}
		}
	}
	for (const f of await listMd(join(dir, "agents"))) {
		const issue = await checkFrontmatter(join(dir, "agents", f), true);
		if (issue) issues.push(`agents/${f}: ${issue}`);
	}
	for (const f of await listMd(join(dir, "commands"))) {
		const issue = await checkFrontmatter(join(dir, "commands", f), false);
		if (issue) issues.push(`commands/${f}: ${issue}`);
	}
	return issues;
}
