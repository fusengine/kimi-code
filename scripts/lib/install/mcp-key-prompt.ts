/**
 * mcp-key-prompt.ts — Prompt for missing required API keys of the SELECTED
 * servers before the MCP merge; answers go to $KIMI_HOME/.env + this run's
 * env. TTY: clack note + one text per key. Non-TTY: original piped flow
 * (shared stdin buffer) — unchanged. Dry-run / --skip-env skip (unless
 * FUSENGINE_FORCE_PROMPT=1, used by tests).
 */
import { createInterface } from "node:readline/promises";
import type { Clack } from "./ui";
import type { InstallContext, InstallStepResult, McpServerConfig } from "../../../src/interfaces/index.ts";
import { resolutionEnv } from "./env-file";
import { nextPipedLine } from "./stdin-lines";
import { collectRawServers } from "./mcp-resolve";
import { info, initUi, plan, warn } from "./ui";

/** Required-but-missing API keys across SELECTED catalog + plugin .bak servers. */
export async function missingKeys(ctx: InstallContext): Promise<McpServerConfig[]> {
	const env = await resolutionEnv(ctx);
	const seen = new Set<string>();
	const missing: McpServerConfig[] = [];
	for (const { name, cfg } of await collectRawServers(ctx)) {
		if (ctx.mcpSelection && !ctx.mcpSelection.has(name)) continue;
		if (seen.has(name)) continue;
		seen.add(name);
		if (cfg.requiresApiKey === true && typeof cfg.apiKeyEnv === "string" && !env[cfg.apiKeyEnv]) missing.push(cfg);
	}
	return missing;
}

/** Append KEY=value lines to $KIMI_HOME/.env, skipping keys already present. */
async function saveKeys(ctx: InstallContext, entries: Record<string, string>): Promise<void> {
	const path = `${ctx.kimiHome}/.env`;
	let text = "";
	try { text = await Bun.file(path).text(); } catch { /* new file */ }
	for (const [k, v] of Object.entries(entries)) {
		if (!new RegExp(`^${k}=`, "m").test(text)) text += `${text && !text.endsWith("\n") ? "\n" : ""}${k}=${v}\n`;
	}
	await Bun.write(path, text);
}

/** Record one answer: a value feeds .env + this run's env; empty skips the server. */
function takeAnswer(answers: Record<string, string>, envName: string, value: string): void {
	if (value) { answers[envName] = value; process.env[envName] = value; } else warn(`${envName} skipped — its server will not be installed`);
}

/** TTY flow: note listing the missing keys, then one text prompt per key. */
async function clackKeys(p: Clack, missing: McpServerConfig[], answers: Record<string, string>): Promise<void> {
	p.note(missing.map((c) => `${c.apiKeyEnv} — ${c.apiKeyUrl ?? "required"}`).join("\n"), `${missing.length} API key(s) required`);
	for (const c of missing) {
		const v = await p.text({ message: String(c.apiKeyEnv), placeholder: String(c.apiKeyUrl ?? "") });
		if (p.isCancel(v)) { warn("key prompt cancelled — remaining keys skipped"); break; }
		takeAnswer(answers, String(c.apiKeyEnv), String(v).trim());
	}
}

/** TTY readline fallback / piped flow: shared stdin buffer, original strings. */
async function makeAsker(): Promise<(q: string) => Promise<string>> {
	if (!process.stdin.isTTY) return async (q) => (process.stdout.write(q), nextPipedLine());
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return async (q) => rl.question(q);
}

/** Prompt for missing keys; answers feed this run's resolution + the .env file. */
export async function promptMcpKeys(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "promptMcpKeys", status: "ok", notes: [] };
	const missing = await missingKeys(ctx);
	if (missing.length === 0) { res.status = "skip"; res.notes.push("all keys present"); return res; }
	const interactive = process.stdin.isTTY || process.env.FUSENGINE_FORCE_PROMPT === "1";
	if (ctx.dryRun) { plan(`prompt for ${missing.length} API key(s): ${missing.map((c) => c.apiKeyEnv).join(", ")}`); res.notes.push(`${missing.length} key(s) missing`); return res; }
	if (!interactive || ctx.skipEnv) { res.status = "skip"; res.notes.push(`${missing.length} key(s) missing (non-interactive)`); return res; }
	const answers: Record<string, string> = {};
	const p = await initUi();
	if (process.stdin.isTTY && p) {
		await clackKeys(p, missing, answers);
	} else {
		console.log(`\n${missing.length} API key(s) required by MCP servers — leave empty to skip that server.`);
		const ask = await makeAsker();
		for (const c of missing) {
			const hint = c.apiKeyUrl ?? (c._description as string) ?? "required";
			takeAnswer(answers, String(c.apiKeyEnv), (await ask(`  ${c.apiKeyEnv} (${hint}): `)).trim());
		}
	}
	const saved = Object.keys(answers).length;
	if (saved > 0) {
		await saveKeys(ctx, answers);
		info(`${saved} key(s) saved → ${ctx.kimiHome}/.env`);
	}
	res.notes.push(`${saved}/${missing.length} provided`);
	return res;
}
