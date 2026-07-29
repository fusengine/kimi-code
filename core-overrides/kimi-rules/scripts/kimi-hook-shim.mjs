#!/usr/bin/env bun
/**
 * kimi-hook-shim.mjs — bridge between Kimi Code hooks and the Fusengine harness.
 *
 * Kimi runs: bun "${KIMI_PLUGIN_ROOT}/scripts/kimi-hook-shim.mjs" <scope> [args]
 * The shim maps the Kimi environment onto the variables the harness expects
 * (CLAUDE_*), then forwards the hook payload on stdin verbatim. Fail-open by
 * design: any setup problem exits 0 so the session is never blocked.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const HARNESS_REL = "node_modules/@fusengine/harness/dist/cli/bin.mjs";
const HARNESS_FALLBACK = join(
	homedir(),
	".claude/plugins/marketplaces/fusengine-plugins/plugins",
	HARNESS_REL,
);

function readStdin() {
	return new Promise((resolve) => {
		let data = "";
		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk) => (data += chunk));
		process.stdin.on("end", () => resolve(data));
		process.stdin.on("error", () => resolve(data));
	});
}

function parsePayload(raw) {
	try {
		return JSON.parse(raw);
	} catch {
		return {};
	}
}

function resolveHarnessBin(kimiHome) {
	const primary = join(kimiHome, HARNESS_REL);
	if (existsSync(primary)) return primary;
	if (existsSync(HARNESS_FALLBACK)) return HARNESS_FALLBACK;
	return null;
}

async function main() {
	const stdin = await readStdin();
	const payload = parsePayload(stdin);

	// Map Kimi env onto the harness contract (keep CLAUDE_* names: the harness
	// is shared across CLIs and reads those).
	process.env.CLAUDE_PLUGIN_ROOT =
		process.env.KIMI_PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT || "";
	process.env.CLAUDE_PROJECT_DIR = payload.cwd || process.cwd();
	process.env.CLAUDE_HOME = process.env.KIMI_CODE_HOME || "~/.kimi-code";

	const kimiHome = process.env.KIMI_CODE_HOME || join(homedir(), ".kimi-code");
	const bin = resolveHarnessBin(kimiHome);
	if (!bin) {
		process.stderr.write(`kimi-hook-shim: harness bin not found under ${kimiHome} (skipped)\n`);
		process.exit(0);
	}

	const scope = process.argv[2] || "core";
	const args = process.argv.slice(3);
	const child = spawnSync("bun", [bin, "hook", "claude-code", scope, ...args], {
		input: stdin,
		env: process.env,
		stdio: ["pipe", "inherit", "inherit"],
	});
	if (child.error) {
		process.stderr.write(`kimi-hook-shim: harness spawn failed: ${child.error.message}\n`);
		process.exit(0);
	}
	process.exit(child.status ?? 0);
}

await main();
