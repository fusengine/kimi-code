/**
 * assert-state.ts — Post-install verification (--yes only). Returns the list
 * of failures (empty = all good); the entry point exits 1 when non-empty.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { exists, readJsonSafe } from "../fs-exists";
import type { InstallContext } from "../../../src/interfaces/index.ts";

const START = "<!-- fusengine:kimi-rules:start -->";
const END = "<!-- fusengine:kimi-rules:end -->";

/** Verify the installed state of $KIMI_HOME; every failed check is returned. */
export async function assertInstalledState(ctx: InstallContext): Promise<string[]> {
	const failures: string[] = [];
	const agentsMd = Bun.file(join(ctx.kimiHome, "AGENTS.md"));
	const body = (await agentsMd.exists()) ? await agentsMd.text() : "";
	if (!body.includes(START) || !body.includes(END)) {
		failures.push("AGENTS.md is missing the fusengine:kimi-rules fences");
	}
	const bin = join(ctx.kimiHome, "node_modules", "@fusengine", "harness", "dist", "cli", "bin.mjs");
	if (!(await exists(bin))) failures.push(`harness bin missing: ${bin}`);
	const agentsDir = join(ctx.kimiHome, "agents");
	const agentCount = (await exists(agentsDir))
		? (await readdir(agentsDir)).filter((f) => f.endsWith(".md")).length
		: 0;
	if (agentCount === 0) failures.push(`no agents installed in ${agentsDir}`);
	if (!ctx.skipMcp) {
		const mcp = await readJsonSafe<{ mcpServers?: unknown }>(join(ctx.kimiHome, "mcp.json"));
		if (!mcp || typeof mcp !== "object" || !("mcpServers" in mcp)) {
			failures.push("mcp.json missing, unparsable, or lacks mcpServers");
		}
	}
	return failures;
}
