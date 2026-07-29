/**
 * Shape of a Claude Code `hooks/hooks.json` document, shared by the hook
 * migration step, plus the hooks-e2e test-suite shapes. Types only.
 */
import type { KimiHook } from "./migration.ts";

/** A single hook entry (Kimi only executes `type: "command"`). */
export interface ClaudeHookEntry {
	type: string;
	command?: string;
	prompt?: string;
	timeout?: number;
}

/** A matcher grouping the hooks it fans out to. */
export interface ClaudeHookMatcher {
	matcher?: string;
	hooks: ClaudeHookEntry[];
}

/** Source document keyed by event name. */
export interface ClaudeHooksFile {
	hooks?: Record<string, ClaudeHookMatcher[]>;
}

/** One row of scripts/lib/harness-hook-routes.json. */
export interface HarnessHookRoute {
	plugin: string;
	event: string;
	matcher: string;
	scope: string;
}

/** A manifest hook rule bound to the plugin dir/name that declares it. */
export interface HookRuleRef {
	pluginDir: string;
	pluginName: string;
	hook: KimiHook;
}

/** Parsed shim invocation: scope token plus any extra args. */
export interface ShimCommand {
	scope: string;
	args: string[];
}

/** What the layer-2 fake harness records to disk for assertions. */
export interface FakeHarnessRecord {
	argv: string[];
	stdin: string;
	env: Record<string, string | undefined>;
}

/** Outcome of one shim invocation (record present only under the fake harness). */
export interface ShimRun {
	code: number;
	stdout: string;
	stderr: string;
	record?: FakeHarnessRecord;
}

/** Per-plugin tallies from the layer-3 live sweep. */
export interface LivePluginReport {
	plugin: string;
	ok: number;
	deny: number;
	silent: number;
	violations: string[];
}

/** Optional overrides for synthesizePayload (targeted live assertions). */
export interface PayloadOverrides {
	toolName?: string;
	toolInput?: Record<string, unknown>;
	prompt?: string;
}
