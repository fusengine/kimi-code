/**
 * Text adapter applied to agent descriptions and bodies.
 * Tool renames follow the Kimi tool set; product renames are idempotent
 * with the repo-wide scrub pass that runs after migration.
 */

const ADAPTER_REPLACEMENTS: Array<[RegExp, string]> = [
	[textRe("Claude Code"), "Kimi Code"],
	[textRe("Claude CLI"), "Kimi CLI"],
	[wordRe("WebFetch"), "FetchURL"],
	[wordRe("MultiEdit"), "Edit"],
	[textRe("`Task`"), "`Agent`"],
	[textRe("Task tool"), "Agent tool"],
];

export function adaptAgentText(text: string): string {
	return ADAPTER_REPLACEMENTS.reduce(
		(current, [pattern, replacement]) => current.replace(pattern, replacement),
		text,
	);
}

/** Token-level renames for frontmatter `tools` lists (bare `Task` included). */
export function adaptToolsList(tools: string): string {
	return tools
		.replace(wordRe("WebFetch"), "FetchURL")
		.replace(wordRe("MultiEdit"), "Edit")
		.replace(wordRe("Task"), "Agent");
}

function textRe(value: string): RegExp {
	return new RegExp(escapeRegex(value), "g");
}

function wordRe(value: string): RegExp {
	return new RegExp(String.raw`\b${escapeRegex(value)}\b`, "g");
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
