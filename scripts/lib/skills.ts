import { readdir, stat, mkdir, cp } from "node:fs/promises";
import { join } from "node:path";
import type { ConverterResult } from "./types";
import { exists } from "./fs-exists";
import { parseFrontmatter, stringifyFrontmatter } from "./yaml";

const SKIP_ENTRIES = new Set(["SKILL.md", ".DS_Store", "node_modules", "dist", "_archive"]);

function buildHeader(name: string, description: string): string {
	const desc = description.replace(/\r?\n+/g, " ").trim();
	const body = stringifyFrontmatter({ name, description: desc });
	return `---\n${body}\n---\n\n`;
}

async function migrateSingleSkill(
	srcSkillDir: string,
	destSkillDir: string,
	skillName: string,
): Promise<string[]> {
	const errors: string[] = [];
	const skillFile = join(srcSkillDir, "SKILL.md");
	if (!(await exists(skillFile))) {
		errors.push(`${skillName}: missing SKILL.md`);
		return errors;
	}
	const content = await Bun.file(skillFile).text();
	const fm = parseFrontmatter(content);
	const rawName = fm.data.name;
	const rawDesc = fm.data.description;
	const name = (Array.isArray(rawName) ? rawName.join(", ") : rawName) || skillName;
	const description = Array.isArray(rawDesc) ? rawDesc.join(", ") : rawDesc ?? "";
	// Frontmatter: keep ONLY name + description. Body verbatim.
	const newContent = buildHeader(name, description) + fm.body;
	await mkdir(destSkillDir, { recursive: true });
	await Bun.write(join(destSkillDir, "SKILL.md"), newContent);

	// references/ and any sibling asset dirs/files ride along unmodified.
	for (const entry of await readdir(srcSkillDir)) {
		if (SKIP_ENTRIES.has(entry)) continue;
		await cp(join(srcSkillDir, entry), join(destSkillDir, entry), { recursive: true });
	}
	return errors;
}

export async function transformSkills(
	srcDir: string,
	destDir: string,
): Promise<ConverterResult> {
	const errors: string[] = [];
	const srcSkillsRoot = join(srcDir, "skills");
	if (!(await exists(srcSkillsRoot))) {
		return { converted: 0, errors };
	}
	const destSkillsRoot = join(destDir, "skills");
	await mkdir(destSkillsRoot, { recursive: true });

	let converted = 0;
	for (const entry of await readdir(srcSkillsRoot)) {
		const srcEntry = join(srcSkillsRoot, entry);
		const s = await stat(srcEntry);
		if (!s.isDirectory()) continue;
		const errs = await migrateSingleSkill(srcEntry, join(destSkillsRoot, entry), entry);
		if (errs.length === 0) converted++;
		else errors.push(...errs);
	}
	return { converted, errors };
}
