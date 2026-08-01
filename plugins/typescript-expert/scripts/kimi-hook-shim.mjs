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
 *
 * Env precedence: $KIMI_HOME/.env is overlaid ON TOP of the inherited
 * environment when spawning the harness. The harness's own loadDotenv never
 * overrides an existing var, so cross-harness shell pollution (e.g. fish
 * conf.d/claude-env.fish exporting every key of ~/.claude/.env — TTL, refs)
 * would otherwise win over the kimi config in every hook process.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const HARNESS_REL = "node_modules/@fusengine/harness/dist/cli/bin.mjs";

/** Strip one matching pair of surrounding quotes from a raw .env value. */
function unquote(v) {
	const t = v.trim();
	return t.length >= 2 && t[0] === t.at(-1) && (t[0] === '"' || t[0] === "'") ? t.slice(1, -1) : t;
}

/** Parse $KIMI_HOME/.env (KEY=VALUE lines); {} when missing or unreadable. */
function loadKimiEnv(kimiHome) {
	const path = join(kimiHome, ".env");
	const env = {};
	if (!existsSync(path)) return env;
	try {
		for (const line of readFileSync(path, "utf8").split("\n")) {
			const m = line.trim().match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
			if (m) env[m[1]] = unquote(m[2]);
		}
	} catch { /* fail-open: unreadable .env leaves the inherited env as-is */ }
	return env;
}

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

/**
 * Rules-scope env: the harness reads its rules corpus from
 * <KIMI_PLUGIN_ROOT>/rules, but kimi sets KIMI_PLUGIN_ROOT to the SUITE root
 * and the corpus lives in the kimi-rules sub-plugin. Remap the var to that
 * sub-plugin when its rules/ dir exists, else the injection comes out empty.
 */
function rulesScopeEnv(env) {
	const root = env.KIMI_PLUGIN_ROOT;
	if (!root) return env;
	const rulesPlugin = join(root, "plugins", "kimi-rules");
	return existsSync(join(rulesPlugin, "rules")) ? { ...env, KIMI_PLUGIN_ROOT: rulesPlugin } : env;
}

/** Parse the hook event name from the stdin payload; "" when unreadable. */
function eventNameOf(stdin) {
	try { return JSON.parse(stdin)?.hook_event_name ?? ""; } catch { return ""; }
}

/**
 * Normalize the tool_input field names onto the Claude wire shape the harness
 * was written for: Kimi sends `path`, harness consumers like the lessons
 * write-tracker read `file_path` (Claude's key) and silently no-op without it
 * — the lessons Stop reminder can never arm without this alias. Fail-open:
 * the original payload is returned byte-identical on any parse problem.
 */
function normalizeToolInput(stdin) {
	try {
		const payload = JSON.parse(stdin);
		const ti = payload?.tool_input;
		if (ti && typeof ti === "object" && typeof ti.path === "string" && ti.file_path === undefined) {
			ti.file_path = ti.path;
			return JSON.stringify(payload);
		}
		return stdin;
	} catch { return stdin; }
}

/**
 * Parse the project cwd from the stdin payload; "" when unreadable/missing.
 * Kimi runs plugin hooks with the process cwd set to the PLUGIN ROOT, and the
 * harness CLI passes `process.cwd()` (not the payload cwd) to its gates — so
 * without this, cwd-sensitive gates (the pre-commit tsc/eslint/prettier/ruff
 * sweep) evaluate the deployed suite instead of the user's project and block
 * every commit with phantom errors (TS2688 from the suite's own tsconfig).
 */
function payloadCwdOf(stdin) {
	try {
		const cwd = JSON.parse(stdin)?.cwd;
		return typeof cwd === "string" && cwd.length > 0 && existsSync(cwd) ? cwd : "";
	} catch { return ""; }
}

/**
 * Compact the rules injection on UserPromptSubmit. Kimi renders ONE hook
 * content in BOTH the model context (<hook_result>) and the TUI block
 * (hook.result event) — no model-only channel exists (verified in 0.30.0
 * dist). The full corpus still reaches the model at SessionStart and every
 * SubagentStart; on each prompt the harness's `<corpus>\n\n<notice>` stdout
 * is redundant, so forward only the notices — the user sees one line per
 * injection, the model loses nothing it does not already have from session
 * start. When $KIMI_HOME/AGENTS.md is present (loaded natively into the
 * model's system prompt), an "AGENTS.md injected" line is prepended so the
 * user sees both channels confirmed. Rules scope ONLY: lessons keep their
 * full per-prompt injection — their payload is small and the hook is their
 * only channel to the model. JSON envelopes (deny) pass through untouched.
 */
/**
 * Compact the rules/lessons injections on UserPromptSubmit. Kimi renders ONE
 * hook content in BOTH the model context (<hook_result>) and the TUI block
 * (hook.result event) — no model-only channel exists (verified in 0.30.0
 * dist). The full corpus still reaches the model at SessionStart and every
 * SubagentStart; on each prompt the harness's `<corpus>\n\n<notice>` stdout
 * is redundant, so forward only the notices — the user sees one line per
 * injection, the model loses nothing it does not already have from session
 * start. Two output shapes are handled: the long `<corpus>\n\n<notice>` form
 * (trimmed to the notice) and the harness's own short notice (guard true —
 * passed through). When $KIMI_HOME/AGENTS.md is present (loaded natively
 * into the model's system prompt), an "AGENTS.md injected" line is prepended
 * in both cases. rules + lessons scopes ONLY; JSON envelopes (deny) pass
 * through untouched.
 */
function compactPromptInjection(stdout, scope, eventName, kimiHome) {
	if ((scope !== "rules" && scope !== "lessons") || eventName !== "UserPromptSubmit") return stdout;
	if (!stdout || stdout.startsWith("{")) return stdout;
	let agentsNote = "";
	if (scope === "rules") {
		const agentsMd = join(kimiHome, "AGENTS.md");
		agentsNote = existsSync(agentsMd) && readFileSync(agentsMd, "utf8").trim().length > 0
			? "AGENTS.md injected\n" : "";
	}
	const cut = stdout.lastIndexOf("\n\n");
	if (cut === -1) {
		const trimmed = stdout.trim();
		return trimmed.length > 0 && trimmed.length <= 120 ? `${agentsNote}${trimmed}\n` : stdout;
	}
	const notice = stdout.slice(cut + 2).trim();
	if (notice.length === 0 || notice.length > 120) return stdout;
	return `${agentsNote}${notice}\n`;
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
	const eventName = eventNameOf(stdin);
	const payloadCwd = payloadCwdOf(stdin);
	const base = scope === "rules" ? rulesScopeEnv(process.env) : process.env;
	const child = spawnSync("bun", [bin, "hook", "kimi", scope, ...args], {
		input: normalizeToolInput(stdin),
		env: { ...base, ...loadKimiEnv(kimiHome) },
		cwd: payloadCwd || undefined,
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
	const out = compactPromptInjection(stdout, scope, eventName, kimiHome);
	if (out) process.stdout.write(out);
	if (stderr) process.stderr.write(stderr);
	process.exit(child.status ?? 0);
}

await main();
