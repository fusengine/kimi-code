import type { ClaudeManifest } from "./types";

function displayName(name: string): string {
	return name
		.replace(/^fuse-/, "")
		.split("-")
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

function shortDescription(description: string): string {
	const firstSentence = description.split(/(?<=\.)\s+/)[0] ?? description;
	return firstSentence.length <= 120 ? firstSentence : `${description.slice(0, 117)}...`;
}

function developerName(author: ClaudeManifest["author"]): string {
	if (!author) return "Fusengine";
	return typeof author === "string" ? author : author.name;
}

/** Kimi manifest `interface` block: display metadata for the plugin browser. */
export function buildInterface(
	source: ClaudeManifest,
	name: string,
): Record<string, unknown> {
	return {
		displayName: displayName(name),
		shortDescription: shortDescription(source.description ?? ""),
		developerName: developerName(source.author),
	};
}
