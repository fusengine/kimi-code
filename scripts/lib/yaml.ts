/**
 * Minimal YAML frontmatter parser. Bun-native, no deps.
 * Handles: scalar strings, comma-separated inline lists, block lists, quoted strings.
 */

import type { Frontmatter, FrontmatterData } from "./yaml.types.ts";

export function parseFrontmatter(raw: string): Frontmatter {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		return { data: {}, body: raw };
	}
	const data = parseYamlBlock(match[1]);
	const body = match[2] ?? "";
	return { data, body };
}

function parseYamlBlock(block: string): FrontmatterData {
	const out: FrontmatterData = {};
	let currentListKey: string | null = null;
	for (const rawLine of block.split(/\r?\n/)) {
		const line = rawLine.replace(/\s+$/, "");
		const trimmed = line.trimStart();
		if (!trimmed || trimmed.startsWith("#")) continue;
		// Indented continuation lines belong to a nested map/list we do not model.
		if (line !== trimmed && !trimmed.startsWith("- ")) continue;
		if (currentListKey && trimmed.startsWith("- ")) {
			const list = Array.isArray(out[currentListKey]) ? out[currentListKey] : [];
			out[currentListKey] = [...list, stripQuotes(trimmed.slice(2).trim())];
			continue;
		}
		const idx = line.indexOf(":");
		if (idx <= 0) continue;
		const key = line.slice(0, idx).trim();
		const value = line.slice(idx + 1).trim();
		out[key] = parseValue(value);
		currentListKey = value ? null : key;
	}
	return out;
}

function parseValue(value: string): string | string[] {
	if (!value) return "";
	const unquoted = stripQuotes(value);
	if (unquoted !== value) return unquoted;
	if (value.includes(",")) {
		return value.split(",").map((p) => stripQuotes(p.trim())).filter(Boolean);
	}
	return value;
}

function stripQuotes(s: string): string {
	if (s.length >= 2) {
		const first = s[0];
		const last = s[s.length - 1];
		if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
			return s.slice(1, -1);
		}
	}
	return s;
}

/**
 * Serialize a flat key/value map into YAML frontmatter body (no --- delimiters).
 * Values containing YAML-special sequences are double-quoted.
 */
export function stringifyFrontmatter(data: Record<string, string | string[]>): string {
	const lines: string[] = [];
	for (const [key, value] of Object.entries(data)) {
		if (Array.isArray(value)) {
			lines.push(`${key}: ${quoteIfNeeded(value.join(", "))}`);
		} else {
			lines.push(`${key}: ${quoteIfNeeded(value)}`);
		}
	}
	return lines.join("\n");
}

function quoteIfNeeded(value: string): string {
	if (/[:#]|^[\s[\]{&*!|>'"%@`,]|\s$/.test(value)) {
		return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
	}
	return value;
}
