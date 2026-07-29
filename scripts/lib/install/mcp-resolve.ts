/**
 * mcp-resolve.ts — Scan every plugins/<dir>/mcp.json.bak ({mcpServers: …})
 * resolve ${VAR} placeholders against $KIMI_HOME/.env ∪ process.env.
 * A server whose url/command placeholders cannot be resolved is skipped
 * (with a warning) — half-configured servers must never reach mcp.json.
 */
import { readJsonSafe } from "../fs-exists";
import type { InstallContext, McpServerConfig } from "../../../src/interfaces/index.ts";
import { listPlugins } from "./plugin-catalog";
import { resolutionEnv } from "./env-file";
import { join } from "node:path";

const PLACEHOLDER_RE = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

/** Vars referenced by `raw` that have no value in `env`. */
export function unresolvedVars(raw: string, env: Record<string, string>): string[] {
	const missing: string[] = [];
	for (const m of raw.matchAll(PLACEHOLDER_RE)) {
		if (!(m[1] in env)) missing.push(m[1]);
	}
	return missing;
}

/** Deep-resolve ${VAR} in every string of a server config; missing → "". */
export function resolveDeep(value: unknown, env: Record<string, string>): unknown {
	if (typeof value === "string") {
		return value.replace(PLACEHOLDER_RE, (_, v: string) => env[v] ?? "");
	}
	if (Array.isArray(value)) return value.map((v) => resolveDeep(v, env));
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([k, v]) => [k, resolveDeep(v, env)]),
		);
	}
	return value;
}

type BakFile = { mcpServers?: Record<string, McpServerConfig> };

/**
 * Collect resolved servers across all plugins. First plugin (sorted by
 * manifest name) wins on duplicate server names. Returns the server map in
 * deterministic order plus one warning per skipped server.
 */
export async function scanMcpServers(
	ctx: InstallContext,
): Promise<{ servers: Map<string, McpServerConfig>; warnings: string[] }> {
	const env = await resolutionEnv(ctx);
	const servers = new Map<string, McpServerConfig>();
	const warnings: string[] = [];
	for (const plugin of await listPlugins(ctx.pluginsRoot)) {
		const bak = await readJsonSafe<BakFile>(join(ctx.pluginsRoot, plugin.dir, "mcp.json.bak"));
		for (const [name, cfg] of Object.entries(bak?.mcpServers ?? {})) {
			if (servers.has(name)) continue;
			const blockers = ["url", "command"]
				.filter((k) => typeof cfg[k] === "string")
				.flatMap((k) => unresolvedVars(cfg[k] as string, env));
			if (blockers.length > 0) {
				warnings.push(`skip MCP '${name}' (${plugin.dir}): unresolved ${[...new Set(blockers)].join(", ")}`);
				continue;
			}
			servers.set(name, resolveDeep(cfg, env) as McpServerConfig);
		}
	}
	return { servers, warnings };
}
