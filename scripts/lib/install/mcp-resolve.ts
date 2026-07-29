/**
 * mcp-resolve.ts — Collect MCP servers from the central catalog
 * (scripts/mcp/mcp.json, ported from the Claude installer) THEN from
 * per-plugin mcp.json.bak files (dedupe by name, first wins).
 * Resolves ${VAR} against $KIMI_HOME/.env ∪ process.env and normalizes
 * every entry to the Kimi schema: stdio = {command,args?,env?,cwd?},
 * http = {url,headers?,transport?:"sse"} — no `type`, no catalog metadata.
 * requiresApiKey entries whose apiKeyEnv var is missing are skipped with
 * a warning pointing at apiKeyUrl.
 */
import { join } from "node:path";
import { readJsonSafe } from "../fs-exists";
import type { InstallContext, McpServerConfig } from "../../../src/interfaces/index.ts";
import { listPlugins } from "./plugin-catalog";
import { resolutionEnv } from "./env-file";

const PLACEHOLDER_RE = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
const META_KEYS = new Set(["type", "_description", "default", "requiresApiKey", "apiKeyEnv", "apiKeyUrl"]);

type BakFile = { mcpServers?: Record<string, McpServerConfig> };

/** Deep-resolve ${VAR} in every string of a server config; missing → "". */
export function resolveDeep(value: unknown, env: Record<string, string>): unknown {
	if (typeof value === "string") return value.replace(PLACEHOLDER_RE, (_, v: string) => env[v] ?? "");
	if (Array.isArray(value)) return value.map((v) => resolveDeep(v, env));
	if (value && typeof value === "object") {
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveDeep(v, env)]));
	}
	return value;
}

/** Keep only Kimi-schema fields; map `type: "sse"` → transport, drop the rest. */
export function toKimiServer(cfg: McpServerConfig): McpServerConfig {
	const out: Record<string, unknown> = {};
	for (const key of ["command", "args", "env", "cwd", "url", "headers"]) {
		if (cfg[key] !== undefined) out[key] = cfg[key];
	}
	if (cfg.url && cfg.type === "sse") out.transport = "sse";
	return out;
}

/** True when a catalog entry needs an API key that `env` does not provide. */
function keyMissing(cfg: McpServerConfig, env: Record<string, string>): boolean {
	return cfg.requiresApiKey === true && typeof cfg.apiKeyEnv === "string" && !env[cfg.apiKeyEnv as string];
}

/** Scan catalog + plugin .bak files; returns resolved, normalized servers. */
export async function scanMcpServers(
	ctx: InstallContext,
): Promise<{ servers: Map<string, McpServerConfig>; warnings: string[] }> {
	const env = await resolutionEnv(ctx);
	const servers = new Map<string, McpServerConfig>();
	const warnings: string[] = [];

	const sources: Array<{ origin: string; file: BakFile | null }> = [];
	sources.push({
		origin: "catalog",
		file: await readJsonSafe<BakFile>(join(ctx.repoRoot, "scripts", "mcp", "mcp.json")),
	});
	for (const plugin of await listPlugins(ctx.pluginsRoot)) {
		sources.push({
			origin: plugin.dir,
			file: await readJsonSafe<BakFile>(join(ctx.pluginsRoot, plugin.dir, "mcp.json.bak")),
		});
	}

	for (const { origin, file } of sources) {
		for (const [name, cfg] of Object.entries(file?.mcpServers ?? {})) {
			if (name.startsWith("_") || servers.has(name)) continue;
			if (keyMissing(cfg, env)) {
				warnings.push(`skip MCP '${name}' (${origin}): missing ${cfg.apiKeyEnv} — get it at ${cfg.apiKeyUrl ?? "the provider"}`);
				continue;
			}
			const resolved = resolveDeep(cfg, env) as McpServerConfig;
			for (const k of Object.keys(resolved)) if (META_KEYS.has(k)) delete resolved[k];
			servers.set(name, toKimiServer(resolved));
		}
	}
	return { servers, warnings };
}
