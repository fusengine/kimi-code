import { join } from "node:path";
import { mkdir, readdir } from "node:fs/promises";
import type { ConverterResult } from "./types";
import type { FrontmatterData } from "./yaml.types";
import { parseFrontmatter, stringifyFrontmatter } from "./yaml";
import { adaptAgentText, adaptToolsList } from "./agent-adapter";

function kebab(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function asString(value: string | string[] | undefined): string {
	if (value === undefined) return "";
	return Array.isArray(value) ? value.join(", ") : value;
}

/** Pull the "Use when:" clause out of a description, if present. */
function deriveWhenToUse(description: string): string | undefined {
	const idx = description.indexOf("Use when:");
	if (idx < 0) return undefined;
	const rest = description.slice(idx + "Use when:".length);
	const stop = rest.search(/Do NOT use/i);
	const clause = (stop >= 0 ? rest.slice(0, stop) : rest).trim();
	return clause.replace(/[.\s]+$/, "") || undefined;
}

/**
 * Emit ONLY the Kimi fields: name, description, whenToUse, tools.
 * Claude-only fields (model, color, skills, effort, rules, ...) are dropped.
 */
function buildAgentFile(data: FrontmatterData, body: string, fallback: string): string {
	const description = adaptAgentText(asString(data.description));
	const out: Record<string, string> = {
		name: kebab(asString(data.name) || fallback),
		description,
	};
	const whenToUse = deriveWhenToUse(description);
	if (whenToUse) out.whenToUse = whenToUse;
	const tools = asString(data.tools);
	if (tools) out.tools = adaptToolsList(tools);
	return `---\n${stringifyFrontmatter(out)}\n---\n\n${adaptAgentText(body)}`;
}

export async function transformAgents(
	srcDir: string,
	destDir: string,
): Promise<ConverterResult> {
	const errors: string[] = [];
	const srcAgents = join(srcDir, "agents");
	let entries: string[];
	try {
		entries = await readdir(srcAgents);
	} catch {
		return { converted: 0, errors };
	}
	const destAgents = join(destDir, "agents");
	await mkdir(destAgents, { recursive: true });

	let converted = 0;
	for (const entry of entries) {
		if (!entry.endsWith(".md")) continue;
		try {
			const raw = await Bun.file(join(srcAgents, entry)).text();
			const fm = parseFrontmatter(raw);
			const out = buildAgentFile(fm.data, fm.body, entry.replace(/\.md$/, ""));
			await Bun.write(join(destAgents, entry), out);
			converted++;
		} catch (e) {
			errors.push(`agents/${entry}: ${(e as Error).message}`);
		}
	}
	return { converted, errors };
}
