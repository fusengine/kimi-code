/**
 * hooks-block.ts — Build the global [[hooks]] block for config.toml
 * (rules injection + core guards), with TOML-literal command strings.
 */
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { InstallContext } from "../../../src/interfaces/index.ts";

export const START = "# >>> fusengine hooks >>>";
export const END = "# <<< fusengine hooks <<<";

/** kimi-rules / core-guards dirs: managed copy when installed, else the repo. */
function scopeDir(ctx: InstallContext, plugin: string): string {
	const managed = join(ctx.kimiHome, "plugins", "managed", "fusengine", "plugins", plugin);
	return existsSync(managed) ? managed : join(ctx.pluginsRoot, plugin);
}

/** The [[hooks]] block (global bootstrap: rules + core guards). */
export function buildBlock(ctx: InstallContext): string {
	const shim = join(ctx.kimiHome, "hooks", "fusengine-hook-shim.mjs");
	const rules = scopeDir(ctx, "kimi-rules");
	const guards = scopeDir(ctx, "core-guards");
	const cmd = (root: string, scope: string) => `KIMI_PLUGIN_ROOT="${root}" bun "${shim}" ${scope}`;
	return [
		START,
		hook("SessionStart", cmd(rules, "rules")),
		hook("SubagentStart", cmd(rules, "rules")),
		hook("UserPromptSubmit", cmd(rules, "rules")),
		hook("PreToolUse", cmd(guards, "core"), 'matcher = "Bash|Write|Edit"'),
		hook("PostToolUse", cmd(guards, "core")),
		END,
		"",
	].join("\n");
}

function hook(event: string, command: string, matcher?: string): string {
	const m = matcher ? `\n${matcher}` : "";
	// TOML literal string (single quotes): the command embeds double quotes.
	return `[[hooks]]\nevent = "${event}"${m}\ncommand = '${command}'\ntimeout = 10\n`;
}

/** Replace or append the fenced block in config text; preserves user entries. */
export function mergeIntoConfig(text: string, blockText: string): string {
	const re = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
	return re.test(text)
		? text.replace(re, blockText)
		: `${text}${text.endsWith("\n") || text === "" ? "" : "\n"}\n${blockText}`;
}

/** Strip the fenced block from config text (plugin owns hooks). */
export function stripFromConfig(text: string): string {
	return text.replace(new RegExp(`${START}[\\s\\S]*?${END}\\n?`), "");
}
