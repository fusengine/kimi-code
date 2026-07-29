import routesJson from "./harness-hook-routes.json";
import type { HarnessHookRoute } from "./hooks-types";

export const HARNESS_ROUTES = routesJson as HarnessHookRoute[];

const HARNESS_CMD_RE = /hook\s+claude-code(?:\s+([a-z0-9-]+))?(.*)$/i;

/** Extract `<scope>` + trailing args from a `hook claude-code` command line. */
export function extractScopeAndArgs(cmd: string): { scope?: string; args: string[] } {
	const match = cmd.match(HARNESS_CMD_RE);
	if (!match) return { args: [] };
	// Kimi hooks are fail-open by design: drop the `|| true` suffix silently.
	const rest = (match[2] ?? "").replace(/\|\|\s*true\s*$/, "").trim();
	return { scope: match[1], args: rest ? rest.split(/\s+/) : [] };
}

/** Route-table fallback for bare `hook claude-code` commands (no scope). */
export function lookupScope(
	plugin: string,
	event: string,
	matcher: string,
): string | undefined {
	return HARNESS_ROUTES.find(
		(r) => r.plugin === plugin && r.event === event && r.matcher === matcher,
	)?.scope;
}

/** The only accepted hook command shape in a Kimi plugin manifest. */
export function buildShimCommand(scope: string, args: string[]): string {
	const tail = args.length > 0 ? ` ${args.join(" ")}` : "";
	return `bun "\${KIMI_PLUGIN_ROOT}/scripts/kimi-hook-shim.mjs" ${scope}${tail}`;
}
