/**
 * mcp-merge.ts — Merge resolved plugin MCP servers into $KIMI_HOME/mcp.json
 * ({mcpServers: {...}}, JSON without comments). Ownership is tracked only in
 * the sidecar .fusengine-mcp-servers.json: servers we installed are removed
 * before re-adding (idempotent); a same-named server we do NOT own is kept
 * and reported, never clobbered.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { readJsonSafe } from "../fs-exists";
import type { InstallContext, InstallStepResult, McpServerConfig } from "../../../src/interfaces/index.ts";
import { scanMcpServers } from "./mcp-resolve";
import { info, plan, warn } from "./ui";

type McpFile = { mcpServers?: Record<string, McpServerConfig> } & Record<string, unknown>;

function trackPath(ctx: InstallContext): string {
	return join(ctx.kimiHome, ".fusengine-mcp-servers.json");
}

/** Merge current plugin servers into $KIMI_HOME/mcp.json. */
export async function mergeMcp(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "mergeMcp", status: "ok", notes: [] };
	if (ctx.skipMcp) {
		res.status = "skip";
		res.notes.push("--skip-mcp");
		return res;
	}
	const mcpPath = join(ctx.kimiHome, "mcp.json");
	const existing = await readJsonSafe<McpFile>(mcpPath);
	if (existing === null && (await Bun.file(mcpPath).exists())) {
		res.status = "fail";
		res.notes.push(`${mcpPath} is not valid JSON`);
		return res;
	}
	const { servers, warnings } = await scanMcpServers(ctx);
	for (const w of warnings) warn(w);
	const owned: string[] = (await readJsonSafe<string[]>(trackPath(ctx))) ?? [];
	const current: Record<string, McpServerConfig> = { ...(existing?.mcpServers ?? {}) };
	for (const name of owned) delete current[name];
	const installed: string[] = [];
	for (const [name, cfg] of servers) {
		if (name in current) {
			warn(`mcp.json already defines '${name}' (not ours) — keeping yours`);
			continue;
		}
		current[name] = cfg;
		installed.push(name);
	}
	const next: McpFile = { ...(existing ?? {}), mcpServers: current };
	if (ctx.dryRun) {
		plan(`write ${installed.length} server(s) → ${mcpPath} (tracking ${trackPath(ctx)})`);
		res.notes.push(`${installed.length} server(s)`);
		return res;
	}
	await mkdir(ctx.kimiHome, { recursive: true });
	await Bun.write(mcpPath, `${JSON.stringify(next, null, 2)}\n`);
	await Bun.write(trackPath(ctx), `${JSON.stringify(installed.sort(), null, 2)}\n`);
	info(`mcp.json: ${installed.length} server(s) merged, ${owned.length} stale removed`);
	res.notes.push(`${installed.length} server(s)`);
	return res;
}
