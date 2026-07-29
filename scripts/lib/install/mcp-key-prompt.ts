/**
 * mcp-key-prompt.ts — Interactive API-key prompting (parity with the Claude
 * installer): before the MCP merge, prompt for every missing required key,
 * persist answers to $KIMI_HOME/.env and export them for this run.
 * Skipped entirely in dry-run, without a TTY, or with --skip-env (unless
 * FUSENGINE_FORCE_PROMPT=1 — used by tests with piped stdin).
 */
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import type { InstallContext, InstallStepResult, McpServerConfig } from "../../../src/interfaces/index.ts";
import { resolutionEnv } from "./env-file";
import { nextPipedLine } from "./stdin-lines";
import { collectRawServers } from "./mcp-resolve";
import { info, plan, warn } from "./ui";

/** Required-but-missing API keys across catalog + plugin .bak files. */
export async function missingKeys(ctx: InstallContext): Promise<McpServerConfig[]> {
	const env = await resolutionEnv(ctx);
	const seen = new Set<string>();
	const missing: McpServerConfig[] = [];
	for (const { name, cfg } of await collectRawServers(ctx)) {
		if (seen.has(name)) continue;
		seen.add(name);
		if (cfg.requiresApiKey === true && typeof cfg.apiKeyEnv === "string" && !env[cfg.apiKeyEnv as string]) {
			missing.push(cfg);
		}
	}
	return missing;
}

/** Append KEY=value lines to $KIMI_HOME/.env, skipping keys already present. */
async function saveKeys(ctx: InstallContext, entries: Record<string, string>): Promise<void> {
	const path = join(ctx.kimiHome, ".env");
	let text = "";
	try { text = await Bun.file(path).text(); } catch { /* new file */ }
	for (const [k, v] of Object.entries(entries)) {
		if (!new RegExp(`^${k}=`, "m").test(text)) text += `${text && !text.endsWith("\n") ? "\n" : ""}${k}=${v}\n`;
	}
	await Bun.write(path, text);
}

/** Prompt for missing keys; answers feed this run's resolution + the .env file. */
export async function promptMcpKeys(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "promptMcpKeys", status: "ok", notes: [] };
	const missing = await missingKeys(ctx);
	if (missing.length === 0) { res.status = "skip"; res.notes.push("all keys present"); return res; }
	const interactive = process.stdin.isTTY || process.env.FUSENGINE_FORCE_PROMPT === "1";
	if (ctx.dryRun) {
		plan(`prompt for ${missing.length} API key(s): ${missing.map((c) => c.apiKeyEnv).join(", ")}`);
		res.notes.push(`${missing.length} key(s) missing`);
		return res;
	}
	if (!interactive || ctx.skipEnv) {
		res.status = "skip";
		res.notes.push(`${missing.length} key(s) missing (non-interactive)`);
		return res;
	}
	console.log(`\n${missing.length} API key(s) required by MCP servers — leave empty to skip that server.`);
	// Non-TTY stdin closes at EOF while questions are pending, silently ending
	// the process — so piped input is consumed fully upfront, TTY stays interactive.
	const ask = await makeAsker();
	const answers: Record<string, string> = {};
	for (const c of missing) {
		const label = `  ${c.apiKeyEnv} (${c.apiKeyUrl ?? (c._description as string) ?? "required"}): `;
		const v = (await ask(label)).trim();
		if (v) { answers[c.apiKeyEnv as string] = v; process.env[c.apiKeyEnv as string] = v; }
		else warn(`${c.apiKeyEnv} skipped — its server will not be installed`);
	}
	if (Object.keys(answers).length > 0) {
		await saveKeys(ctx, answers);
		info(`${Object.keys(answers).length} key(s) saved → ${join(ctx.kimiHome, ".env")}`);
	}
	res.notes.push(`${Object.keys(answers).length}/${missing.length} provided`);
	return res;
}

/** TTY: sequential readline questions. Piped: shared stdin buffer in order. */
async function makeAsker(): Promise<(q: string) => Promise<string>> {
	if (process.stdin.isTTY) {
		const rl = createInterface({ input: process.stdin, output: process.stdout });
		return async (q) => rl.question(q);
	}
	return async (q) => {
		process.stdout.write(q);
		return nextPipedLine();
	};
}
