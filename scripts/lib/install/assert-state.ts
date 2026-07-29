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
const REFS_KEY = "FUSE_HARNESS_REFS=";

/** FUSE_HARNESS_REFS dirs from $KIMI_HOME/.env; null when the var is absent. */
async function refsDirs(ctx: InstallContext): Promise<string[] | null> {
	const file = Bun.file(join(ctx.kimiHome, ".env"));
	if (!(await file.exists())) return null;
	const line = (await file.text()).split("\n").find((l) => l.startsWith(REFS_KEY));
	return line === undefined ? null : line.slice(REFS_KEY.length).split(":").filter(Boolean);
}

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
	const refs = await refsDirs(ctx);
	if (refs === null) {
		failures.push("FUSE_HARNESS_REFS missing in .env — the SOLID-read gate falls back to other harnesses; rerun install-kimi.ts");
	} else {
		for (const dir of refs) {
			if (!(await exists(dir))) failures.push(`FUSE_HARNESS_REFS stale dir: ${dir} — rerun install-kimi.ts`);
		}
	}
	return failures;
}
