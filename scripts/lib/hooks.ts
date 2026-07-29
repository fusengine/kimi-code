import { join, basename } from "node:path";
import type { ConverterResult, KimiHook, KimiManifest } from "./types";
import type { ClaudeHookEntry, ClaudeHooksFile } from "./hooks-types";
import { exists, readJsonSafe } from "./fs-exists";
import { EVENT_MAP, EVENT_MATCHER_OVERRIDE, rewriteMatcher } from "./hooks-rewrite";
import { buildShimCommand, extractScopeAndArgs, lookupScope } from "./hooks-command";

function convertEntry(
	plugin: string,
	claudeEvent: string,
	matcher: string,
	hook: ClaudeHookEntry,
	warnings: string[],
): KimiHook | null {
	if (hook.type !== "command" || typeof hook.command !== "string") {
		warnings.push(
			`${plugin}: ${claudeEvent} prompt-type hook dropped (Kimi supports command hooks only)`,
		);
		return null;
	}
	const extracted = extractScopeAndArgs(hook.command);
	const scope = extracted.scope ?? lookupScope(plugin, claudeEvent, matcher);
	if (!scope) {
		warnings.push(
			`${plugin}: ${claudeEvent}/${matcher || "<empty>"} scope not extractable and not in route table (defaulted to 'core')`,
		);
	}
	return {
		event: EVENT_MAP[claudeEvent],
		matcher: EVENT_MATCHER_OVERRIDE[claudeEvent] ?? rewriteMatcher(matcher),
		command: buildShimCommand(scope ?? "core", extracted.args),
		...(hook.timeout !== undefined ? { timeout: hook.timeout } : {}),
	};
}

/**
 * Flatten Claude hooks/hooks.json into a `hooks` array on kimi.plugin.json.
 * errors[] = blocking (parse fail). warnings[] = dropped prompt hooks, defaults.
 */
export async function transformHooks(
	srcDir: string,
	destDir: string,
): Promise<ConverterResult> {
	const errors: string[] = [];
	const warnings: string[] = [];
	const plugin = basename(srcDir);
	const srcFile = join(srcDir, "hooks", "hooks.json");
	if (!(await exists(srcFile))) return { converted: 0, errors, warnings };

	const parsed = await readJsonSafe<ClaudeHooksFile>(srcFile);
	if (!parsed) {
		errors.push(`${plugin}/hooks/hooks.json: invalid JSON`);
		return { converted: 0, errors, warnings };
	}
	const manifestPath = join(destDir, "kimi.plugin.json");
	const manifest = await readJsonSafe<KimiManifest>(manifestPath);
	if (!manifest) {
		errors.push(`${plugin}/kimi.plugin.json: missing (manifest step must run first)`);
		return { converted: 0, errors, warnings };
	}

	const hooks: KimiHook[] = [];
	for (const [claudeEvent, matchers] of Object.entries(parsed.hooks ?? {})) {
		if (!EVENT_MAP[claudeEvent]) {
			warnings.push(`${plugin}: unknown event '${claudeEvent}' (skipped)`);
			continue;
		}
		for (const m of matchers ?? []) {
			for (const h of m.hooks ?? []) {
				const converted = convertEntry(plugin, claudeEvent, m.matcher ?? "", h, warnings);
				if (converted) hooks.push(converted);
			}
		}
	}
	if (hooks.length > 0) {
		manifest.hooks = hooks;
		await Bun.write(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
	}
	return { converted: hooks.length, errors, warnings };
}
