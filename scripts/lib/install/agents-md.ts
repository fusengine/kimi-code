/**
 * agents-md.ts — Install the repo AGENTS.md as $KIMI_HOME/AGENTS.md and merge
 * the kimi-rules corpus into it between idempotent fences (rerun replaces
 * the fenced block; outside content is preserved byte-for-byte).
 */
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { exists } from "../fs-exists";
import type { InstallContext, InstallStepResult } from "../../../src/interfaces/index.ts";
import { info, plan } from "./ui";

const START = "<!-- fusengine:kimi-rules:start -->";
const END = "<!-- fusengine:kimi-rules:end -->";
const PRE_BACKUP = "AGENTS.md.pre-fusengine";
/** Replace the fenced rules section in an AGENTS.md body, or append it. */
export function mergeRulesSection(body: string, corpus: string): string {
	const section = `${START}\n${corpus}\n${END}`;
	const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
	// Replacement function (not string): corpus may contain $&, $', $$ patterns.
	if (pattern.test(body)) return body.replace(pattern, () => section);
	const base = body.trimEnd();
	return base.length > 0 ? `${base}\n\n${section}\n` : `${section}\n`;
}

/** Concatenate plugins/kimi-rules/rules/*.md, sorted; "" when dir missing. */
export async function readRulesCorpus(rulesDir: string): Promise<string> {
	if (!(await exists(rulesDir))) return "";
	const files = (await readdir(rulesDir)).filter((f) => f.endsWith(".md")).sort();
	const parts: string[] = [];
	for (const f of files) parts.push((await Bun.file(join(rulesDir, f)).text()).trimEnd());
	return parts.join("\n\n");
}

/** Copy repo AGENTS.md → $KIMI_HOME/AGENTS.md (.pre-fusengine kept on first divergence). */
export async function installAgentsMd(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "installAgentsMd", status: "ok", notes: [] };
	const src = join(ctx.repoRoot, "AGENTS.md");
	const dest = join(ctx.kimiHome, "AGENTS.md");
	if (!(await exists(src))) {
		res.status = "fail";
		res.notes.push(`missing ${src}`);
		return res;
	}
	const destFile = Bun.file(dest);
	const srcText = await Bun.file(src).text();
	const destText = (await destFile.exists()) ? await destFile.text() : "";
	if (destText === srcText) {
		res.status = "skip";
		res.notes.push("already in sync");
		return res;
	}
	const backup = join(ctx.kimiHome, PRE_BACKUP);
	const keepPre = destText.length > 0 && !(await exists(backup));
	if (ctx.dryRun) {
		if (keepPre) plan(`keep pre-existing copy → ${backup}`);
		plan(`write ${src} → ${dest}`);
		return res;
	}
	if (keepPre) {
		await mkdir(ctx.kimiHome, { recursive: true });
		await Bun.write(backup, destText);
		info(`pre-existing AGENTS.md preserved → ${backup}`);
	}
	await Bun.write(dest, srcText);
	info(`AGENTS.md installed → ${dest}`);
	return res;
}

/** Merge the kimi-rules corpus between fences in $KIMI_HOME/AGENTS.md. */
export async function mergeKimiRules(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "mergeKimiRules", status: "ok", notes: [] };
	const corpus = await readRulesCorpus(join(ctx.pluginsRoot, "kimi-rules", "rules"));
	if (!corpus) {
		res.status = "skip";
		res.notes.push("no rules corpus");
		return res;
	}
	const dest = join(ctx.kimiHome, "AGENTS.md");
	const destFile = Bun.file(dest);
	const body = (await destFile.exists()) ? await destFile.text() : "";
	const merged = mergeRulesSection(body, corpus);
	if (ctx.dryRun) {
		plan(`merge ${corpus.length} bytes of rules between ${START} / ${END} in ${dest}`);
		return res;
	}
	await Bun.write(dest, merged);
	info(`kimi-rules merged into ${dest}`);
	return res;
}
