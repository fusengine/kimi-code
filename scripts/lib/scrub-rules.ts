/**
 * scrub-rules.ts — Ordered Claude → Kimi string replacements.
 * Order matters: specific patterns first so they aren't swallowed by
 * broader ones (claude-plugins before claude, Claude Code before Claude).
 */

type Rule = {
	pattern: RegExp;
	replacement: string;
};

const RULES: Rule[] = [
	{ pattern: /\bCLAUDE_PLUGIN_ROOT\b/g, replacement: "KIMI_PLUGIN_ROOT" },
	{ pattern: /\bCLAUDE_PLUGIN_DATA\b/g, replacement: "KIMI_PLUGIN_DATA" },
	{ pattern: /~\/\.claude(?!-)/g, replacement: "~/.kimi-code" },
	{ pattern: /\bCLAUDE\.md\b/g, replacement: "KIMI.md" },
	{ pattern: /\.claude-plugin\b/g, replacement: ".kimi-plugin" },
	{ pattern: /\bclaude-plugins\b/g, replacement: "kimi-code" },
	{ pattern: /\bClaude Code\b/g, replacement: "Kimi Code" },
	{ pattern: /\bClaude CLI\b/g, replacement: "Kimi CLI" },
	{ pattern: /\bClaude\b/g, replacement: "Kimi" },
	{ pattern: /\bclaude\b/g, replacement: "kimi" },
	// Flatten Claude plugin namespaces: `fuse-ai-pilot:sniper` → `sniper`.
	// Agents and skills are flat global names under Kimi; only slash commands
	// keep the plugin prefix (`/fuse-commit-pro:commit` is valid Kimi syntax).
	{ pattern: /(?<!\/)\bfuse-[a-z0-9-]+:(?=[a-z0-9][a-z0-9-]*)/g, replacement: "" },
];

/**
 * Lines that must survive untouched: none today — kept as the extension
 * point if a future converter needs shim/harness compatibility lines.
 */
const SKIP_LINE_RE = /CLAUDE_PLUGIN_ROOT=\$|hook claude-code/;

export function applyRules(src: string): { content: string; count: number } {
	let count = 0;
	const lines = src.split("\n").map((line) => {
		if (SKIP_LINE_RE.test(line)) return line;
		let out = line;
		for (const { pattern, replacement } of RULES) {
			out = out.replace(pattern, () => {
				count++;
				return replacement;
			});
		}
		return out;
	});
	return { content: lines.join("\n"), count };
}
