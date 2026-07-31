#!/usr/bin/env bun
/**
 * statusline-native.mjs — native [status_line].command for Kimi Code.
 * Reproduces the fusengine ported statusline format:
 *   ⎇ main*3 · kimi-code/k3 · high · ctx 42% · edits 7 · 2h05 · kimi-code
 * Sources: the CLI's JSON snapshot on stdin (model, cwd, gitBranch,
 * permissionMode, planMode, contextTokens, maxContextTokens, sessionId,
 * version), [thinking].effort from $KIMI_CODE_HOME/config.toml, and the
 * session's wire.jsonl/state.json under $KIMI_CODE_HOME/sessions for the
 * edit count and session age. Contract: exit 0 always, fast (<300ms).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const HOME = process.env.KIMI_CODE_HOME || join(homedir(), ".kimi-code");

/** Wrap text in an ANSI 256-color SGR code; chalk preserves embedded codes. */
const c = (code, text) => `\x1b[${code}m${text}\x1b[39m`;
const dim = (t) => c(90, t);
const green = (t) => c(32, t);
const yellow = (t) => c(33, t);
const blue = (t) => c(34, t);
const magenta = (t) => c(35, t);
const cyan = (t) => c(36, t);
const red = (t) => c(31, t);
/** Quota color by consumption: green <50%, yellow <80%, red ≥80%. */
const quotaColor = (pct) => (pct >= 80 ? red : pct >= 50 ? yellow : green);

/** First string value found among candidate key spellings (one level deep). */
function pick(obj, keys) {
	for (const k of keys) {
		const v = k.split(".").reduce((o, p) => (o && typeof o === "object" ? o[p] : undefined), obj);
		if (typeof v === "string" && v) return v;
		if (typeof v === "number") return String(v);
	}
	return "";
}

/** `[thinking].effort` from config.toml; "" when unset. */
function thinkingEffort() {
	try {
		const toml = readFileSync(join(HOME, "config.toml"), "utf8");
		return toml.match(/^\s*effort\s*=\s*"([a-z]+)"/m)?.[1] ?? "";
	} catch { return ""; }
}

/** Locate the session dir (sessions/<wd>/session_<id>) for a session id. */
function sessionDir(sessionId) {
	if (!sessionId) return "";
	const bare = sessionId.startsWith("session_") ? sessionId : `session_${sessionId}`;
	try {
		for (const wd of readdirSync(join(HOME, "sessions"))) {
			for (const name of [bare, sessionId]) {
				const dir = join(HOME, "sessions", wd, name);
				if (existsSync(dir)) return dir;
			}
		}
	} catch { /* fall through */ }
	return "";
}

/** Count Edit/Write tool calls in the session wire; 0 when unavailable. */
function editCount(dir) {
	try {
		const wire = readFileSync(join(dir, "agents", "main", "wire.jsonl"), "utf8");
		return (wire.match(/"name":"(Edit|Write)"/g) ?? []).length;
	} catch { return 0; }
}

/** Agent activity from agents/main/: { fg (foreground: agent dirs whose wire.jsonl was written in the last 5s — foreground agents leave no task JSON), bg (running detached tasks from agents/main/tasks/*.json). } */
function bgAgents(dir) {
	const zero = { fg: 0, bg: 0 };
	try {
		const stats = { ...zero };
		const tasksDir = join(dir, "agents", "main", "tasks");
		for (const f of readdirSync(tasksDir)) {
			if (!f.endsWith(".json")) continue;
			try {
				const t = JSON.parse(readFileSync(join(tasksDir, f), "utf8"));
				if (t.kind === "agent" && t.status === "running") stats.bg++;
			} catch { /* skip malformed task file */ }
		}
		const agentsDir = join(dir, "agents");
		const now = Date.now();
		for (const a of readdirSync(agentsDir)) {
			if (a === "main" || a.startsWith(".")) continue;
			try {
				const mtime = Number(Bun.file(join(agentsDir, a, "wire.jsonl")).lastModified ?? 0);
				if (mtime > 0 && now - mtime < 5000) stats.fg++;
			} catch { /* no wire for this agent dir */ }
		}
		return stats;
	} catch { return zero; }
}

/** Cumulative line stats from the session wire: +added (new_string/content lines) / -removed (old_string lines). */
function editStats(dir) {
	const zero = { added: 0, removed: 0 };
	try {
		const wire = readFileSync(join(dir, "agents", "main", "wire.jsonl"), "utf8");
		const stats = { ...zero };
		for (const line of wire.split("\n")) {
			if (!line.includes('"tool.call"') || (!line.includes('"name":"Edit"') && !line.includes('"name":"Write"'))) continue;
			try {
				const args = JSON.parse(line)?.event?.args ?? {};
				if (typeof args.new_string === "string") stats.added += args.new_string.split("\n").length;
				if (typeof args.old_string === "string") stats.removed += args.old_string.split("\n").length;
				if (typeof args.content === "string") stats.added += args.content.split("\n").length;
			} catch { /* skip malformed line */ }
		}
		return stats;
	} catch { return zero; }
}

/** Session age as compact H:MM from state.json createdAt (session root first). */
function sessionAge(dir) {
	try {
		let createdAt = 0;
		for (const rel of ["state.json", join("agents", "main", "state.json")]) {
			const p = join(dir, rel);
			if (existsSync(p)) {
				const state = JSON.parse(readFileSync(p, "utf8"));
				createdAt = state.createdAt ?? state.created_at ?? 0;
				if (createdAt) break;
			}
		}
		if (!createdAt) return "";
		const mins = Math.max(0, Math.round((Date.now() - createdAt) / 60000));
		return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
	} catch { return ""; }
}

/** Current branch from git itself (always fresh); "" outside a repo. */
function gitBranch(cwd) {
	if (!cwd) return "";
	try {
		const out = Bun.spawnSync(["git", "-C", cwd, "branch", "--show-current"], { stdout: "pipe", stderr: "ignore" });
		return out.stdout.toString().trim();
	} catch { return ""; }
}

/** Git counts from `git status --porcelain`: staged `+n`, unstaged `~n`, untracked `?n`; "" when clean or not a repo. */
function gitCounts(cwd) {
	if (!cwd) return "";
	try {
		const out = Bun.spawnSync(["git", "-C", cwd, "status", "--porcelain"], { stdout: "pipe", stderr: "ignore" });
		let staged = 0, unstaged = 0, untracked = 0;
		for (const line of out.stdout.toString().split("\n")) {
			if (line.length < 2) continue;
			if (line.startsWith("??")) { untracked++; continue; }
			if (line[0] !== " ") staged++;
			if (line[1] !== " ") unstaged++;
		}
		const s = (staged ? `+${staged}` : "") + (unstaged ? `~${unstaged}` : "") + (untracked ? `?${untracked}` : "");
		return s ? ` ${s}` : "";
	} catch { return ""; }
}

/** Compact "in 1h20" / "in 3j" until a reset_at ISO date; "" when past/invalid. */
function untilReset(resetAt) {
	const ms = Date.parse(resetAt ?? "") - Date.now();
	if (!Number.isFinite(ms) || ms <= 0) return "";
	const mins = Math.round(ms / 60000);
	if (mins >= 1440) return `${Math.floor(mins / 1440)}j${Math.floor((mins % 1440) / 60) ? ` ${Math.floor((mins % 1440) / 60)}h` : ""}`;
	return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
}

/**
 * Quota windows from the managed usage API, cached 5 min. Real response
 * shape (verified live): `{ usage: {limit, used, resetTime}, limits:
 * [{ window: { duration, timeUnit: "TIME_UNIT_*" }, detail: { limit, used,
 * resetTime } }] }` — the 300-minute row is the 5h window; top-level usage
 * is the main quota. Values are strings. Silent on any failure.
 */
async function quotaSegments() {
	const cachePath = join(HOME, "cache", "statusline-usage.json");
	const pct = (used, limit) => {
		const l = Number(limit);
		return l > 0 ? Math.round((Number(used) / l) * 100) : 0;
	};
	try {
		let body = null;
		if (existsSync(cachePath)) {
			const cache = JSON.parse(readFileSync(cachePath, "utf8"));
			if (Date.now() - (cache.fetchedAt ?? 0) < 300_000) body = cache.body;
		}
		if (!body) {
			const creds = JSON.parse(readFileSync(join(HOME, "credentials", "kimi-code.json"), "utf8"));
			if (!creds.access_token) return [];
			const res = await fetch("https://api.kimi.com/coding/v1/usages", {
				headers: { Authorization: `Bearer ${creds.access_token}`, Accept: "application/json" },
				signal: AbortSignal.timeout(5000),
			});
			if (!res.ok) return [];
			body = await res.json();
			try {
				Bun.spawnSync(["mkdir", "-p", join(HOME, "cache")]);
				Bun.write(cachePath, JSON.stringify({ fetchedAt: Date.now(), body }));
			} catch { /* cache write is best-effort */ }
		}
		const out = [];
		const fmt = (label, used, limit, resetTime) => {
			const p = pct(used, limit);
			const reset = untilReset(resetTime);
			const parts = [`${label}:`];
			if (reset) parts.push(`↻${reset}`);
			if (Number.isFinite(p)) parts.push(`${p}%`);
			return parts.join(" ");
		};
		const fiveH = (body.limits ?? []).find((r) => r.window?.timeUnit === "TIME_UNIT_MINUTE" && r.window?.duration === 300);
		if (fiveH?.detail) out.push(quotaColor(pct(fiveH.detail.used, fiveH.detail.limit))(fmt("5h", fiveH.detail.used, fiveH.detail.limit, fiveH.detail.resetTime)));
		if (body.usage?.limit) out.push(quotaColor(pct(body.usage.used, body.usage.limit))(fmt("7D", body.usage.used, body.usage.limit, body.usage.resetTime)));
		return out;
	} catch { return []; }
}

/** Middle-truncated path (claude `pathStyle: "truncated"`): first/…/last2. */
function truncPath(cwd) {
	const parts = cwd.replace(/\/+$/, "").split("/").filter(Boolean);
	if (parts.length <= 3) return parts.join("/") || cwd;
	return `${parts[0]}/…/${parts.slice(-2).join("/")}`;
}

/** Current time HH:MM. */
function nowTime() {
	const d = new Date();
	return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

let raw = "";
try { raw = readFileSync(0, "utf8"); } catch { /* no stdin */ }
let snap = {};
try { snap = JSON.parse(raw); } catch { /* keep defaults */ }

const model = pick(snap, ["model", "modelAlias", "model.alias"]);
const cwd = pick(snap, ["cwd", "workDir", "workdir"]);
const branch = gitBranch(cwd) || pick(snap, ["gitBranch", "git_branch", "git.branch", "branch"]);
const perm = pick(snap, ["permissionMode", "permission_mode", "mode"]);
const plan = snap.planMode === true || snap.plan_mode === true ? "PLAN" : "";
const version = pick(snap, ["version"]);
const effort = thinkingEffort();
const sDir = sessionDir(pick(snap, ["sessionId", "session_id"]));
const stats = sDir ? editStats(sDir) : { added: 0, removed: 0 };
const agents = sDir ? bgAgents(sDir) : { fg: 0, bg: 0 };
const age = sDir ? sessionAge(sDir) : "";

const parts = [];
parts.push(dim(nowTime()));
if (branch) parts.push(`${green(`⎇ ${branch}`)}${yellow(gitCounts(cwd))}`);
if (cwd) parts.push(blue(truncPath(cwd)));
if (stats.added + stats.removed > 0) parts.push(magenta(`± +${stats.added}/-${stats.removed}`));
if (agents.fg + agents.bg > 0) parts.push(magenta(`⚙ ${agents.fg} | ${agents.bg} bg`));
parts.push(...(await quotaSegments()));
if (model) parts.push(cyan(effort ? `${model} ${effort}` : model));
if (perm) parts.push(yellow(perm));
if (plan) parts.push(red(plan));
if (version) parts.push(dim(`V ${version}`));
if (age) parts.push(dim(age));

process.stdout.write(`${parts.join(" · ")}\n`);
process.exit(0);
