/**
 * hooks-config.ts — Global hook activation in $KIMI_HOME/config.toml.
 * Plugin hooks only fire once the plugin is installed; this step bootstraps
 * the core guards immediately (rules injection + Bash/Write/Edit guards) via
 * global [[hooks]] between idempotent markers. When the managed plugin copy
 * appears (after /plugins install), the block is REMOVED on the next setup
 * run — plugin hooks take over, no double-firing.
 */
import { join } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import type { InstallContext, InstallStepResult } from "../../../src/interfaces/index.ts";
import { info, plan } from "./ui";

const START = "# >>> fusengine hooks >>>";
const END = "# <<< fusengine hooks <<<";

/** kimi-rules / core-guards dirs: managed copy when installed, else the repo. */
function scopeDir(ctx: InstallContext, plugin: string): string {
	const managed = join(ctx.kimiHome, "plugins", "managed", "fusengine", "plugins", plugin);
	return existsSync(managed) ? managed : join(ctx.pluginsRoot, plugin);
}

/** The [[hooks]] block (global bootstrap: rules + core guards). */
function block(ctx: InstallContext): string {
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

/** Replace or append the fenced block in config.toml; preserves user entries. */
function mergeConfig(text: string, blockText: string): string {
	const re = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
	return re.test(text)
		? text.replace(re, blockText)
		: `${text}${text.endsWith("\n") || text === "" ? "" : "\n"}\n${blockText}`;
}

/** Shim source: repo scripts/hooks copy, else any plugin's bundled copy. */
function shimSource(ctx: InstallContext): string | null {
	const primary = join(ctx.repoRoot, "scripts", "hooks", "kimi-hook-shim.mjs");
	if (existsSync(primary)) return primary;
	for (const dir of readdirSyncSafe(ctx.pluginsRoot)) {
		const candidate = join(ctx.pluginsRoot, dir, "scripts", "kimi-hook-shim.mjs");
		if (existsSync(candidate)) return candidate;
	}
	return null;
}

function readdirSyncSafe(dir: string): string[] {
	try {
		return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
	} catch {
		return [];
	}
}

/** Deploy the shim, write the global block (or remove it when the plugin owns hooks). */
export async function installHooks(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "installHooks", status: "ok", notes: [] };
	const configPath = join(ctx.kimiHome, "config.toml");
	const pluginOwns = existsSync(join(ctx.kimiHome, "plugins", "managed", "fusengine"));
	if (ctx.dryRun) {
		plan(pluginOwns ? "remove global hooks block (plugin covers it)" : "write 5 global [[hooks]] into config.toml");
		res.notes.push(pluginOwns ? "plugin detected — block removed" : "5 rules");
		return res;
	}
	const shim = shimSource(ctx);
	if (!shim) {
		res.status = "fail";
		res.notes.push("kimi-hook-shim.mjs not found in repo or plugins");
		return res;
	}
	await mkdir(join(ctx.kimiHome, "hooks"), { recursive: true });
	await copyFile(shim, join(ctx.kimiHome, "hooks", "fusengine-hook-shim.mjs"));
	const current = existsSync(configPath) ? await readFile(configPath, "utf8") : "";
	const re = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
	const next = pluginOwns ? current.replace(re, "") : mergeConfig(current, block(ctx));
	await writeFile(configPath, next);
	res.notes.push(pluginOwns ? "plugin active — global block removed" : "5 rules + shim deployed");
	info(pluginOwns ? "plugin owns hooks — global block removed" : "global hooks → config.toml");
	return res;
}
