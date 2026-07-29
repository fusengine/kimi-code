#!/usr/bin/env bun
/**
 * kimi-hook-shim.mjs — bridge between Kimi Code hooks and the Fusengine harness.
 *
 * Kimi runs: bun "${KIMI_PLUGIN_ROOT}/scripts/kimi-hook-shim.mjs" <scope> [args]
 * The harness ships a NATIVE kimi adapter (>= 0.1.83) that reads KIMI_CODE_HOME
 * and KIMI_PLUGIN_ROOT itself, and returns denials as JSON on stdout (exit 0):
 *   {"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"..."}}
 *
 * Deny classification (the manchot fix), on permissionDecisionReason:
 *   contains "[CONFIRM]" (git/install/rm — confirmation wanted) → the deny is
 *     SUPPRESSED (not forwarded): Kimi allows the tool and its permission
 *     system prompts the user interactively instead of a dead-end block.
 *   contains "[BLOCKED]" (rm -rf /, force-push — hard danger) → forwarded
 *     verbatim, the block stands.
 * Anything else passes through unchanged. Fail-open on any setup problem.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const HARNESS_REL = "node_modules/@fusengine/harness/dist/cli/bin.mjs";

function readStdin() {
	return new Promise((resolve) => {
		let data = "";
		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk) => (data += chunk));
		process.stdin.on("end", () => resolve(data));
		process.stdin.on("error", () => resolve(data));
	});
}

/** True when the harness output is a confirmation-class denial (not a hard block). */
function isConfirmDeny(stdout) {
	try {
		const out = JSON.parse(stdout);
		const hso = out?.hookSpecificOutput;
		return hso?.permissionDecision === "deny"
			&& typeof hso.permissionDecisionReason === "string"
			&& hso.permissionDecisionReason.includes("[CONFIRM]");
	} catch {
		return false;
	}
}

async function main() {
	const stdin = await readStdin();
	const kimiHome = process.env.KIMI_CODE_HOME || join(homedir(), ".kimi-code");
	const bin = join(kimiHome, HARNESS_REL);
	if (!existsSync(bin)) {
		process.stderr.write(`kimi-hook-shim: harness bin not found under ${kimiHome} — run scripts/install-kimi.ts (skipped)\n`);
		process.exit(0);
	}

	const scope = process.argv[2] || "core";
	const args = process.argv.slice(3);
	const child = spawnSync("bun", [bin, "hook", "kimi", scope, ...args], {
		input: stdin,
		env: process.env,
		stdio: ["pipe", "pipe", "pipe"],
	});
	if (child.error) {
		process.stderr.write(`kimi-hook-shim: harness spawn failed: ${child.error.message}\n`);
		process.exit(0);
	}
	const stdout = (child.stdout ?? "").toString();
	const stderr = (child.stderr ?? "").toString();
	if (isConfirmDeny(stdout)) {
		process.stderr.write("kimi-hook-shim: confirmation-class deny suppressed — Kimi permission system will prompt instead\n");
		process.exit(0);
	}
	if (stdout) process.stdout.write(stdout);
	if (stderr) process.stderr.write(stderr);
	process.exit(child.status ?? 0);
}

await main();
