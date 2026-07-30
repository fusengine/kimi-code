import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const SHIM = resolve(import.meta.dir, "../hooks/kimi-hook-shim.mjs");
const PAYLOAD = JSON.stringify({
	hook_event_name: "PreToolUse",
	session_id: "s",
	cwd: "/tmp",
	tool_input: { command: "ls" },
});

const FAKE_BIN = `let d="";process.stdin.setEncoding("utf8");
process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{
process.stdout.write(JSON.stringify({argv:process.argv.slice(2),stdin:d,
env:{kimiHome:process.env.KIMI_CODE_HOME,kimiRoot:process.env.KIMI_PLUGIN_ROOT,
claudeRoot:process.env.CLAUDE_PLUGIN_ROOT,claudeDir:process.env.CLAUDE_PROJECT_DIR,
claudeHome:process.env.CLAUDE_HOME,ttl:process.env.FUSE_ENFORCE_TTL_SEC,
quoted:process.env.QUOTED_VAR}}))});`;

function makeHome(withHarness: boolean): string {
	const home = mkdtempSync(join(tmpdir(), "kimi-shim-test-"));
	if (withHarness) {
		const binDir = join(home, "node_modules/@fusengine/harness/dist/cli");
		mkdirSync(binDir, { recursive: true });
		writeFileSync(join(binDir, "bin.mjs"), FAKE_BIN);
	}
	return home;
}

function runShim(env: Record<string, string>, args: string[] = []) {
	// Strip CLAUDE_* from the ambient env so "no synthesis" assertions are hermetic.
	const base = { ...(process.env as Record<string, string>) };
	delete base.CLAUDE_PLUGIN_ROOT;
	delete base.CLAUDE_PROJECT_DIR;
	delete base.CLAUDE_HOME;
	const proc = spawnSync("bun", [SHIM, ...args], {
		input: PAYLOAD,
		env: { ...base, ...env },
		encoding: "utf8",
	});
	return { code: proc.status, stdout: proc.stdout, stderr: proc.stderr };
}

describe("kimi-hook-shim", () => {
	test("missing harness bin exits 0 (fail-open) with a stderr note", () => {
		const home = makeHome(false);
		// HOME override keeps the test hermetic (no real home is read).
		const r = runShim({ KIMI_CODE_HOME: join(home, ".kimi-code"), HOME: home });
		expect(r.code).toBe(0);
		expect(r.stderr).toContain("harness bin not found");
	});

	test("forwards scope, args, stdin and passes KIMI_* through (no CLAUDE_* synthesis)", () => {
		const home = makeHome(true);
		const r = runShim(
			{
				KIMI_CODE_HOME: home,
				KIMI_PLUGIN_ROOT: "/virtual/plugin/root",
				HOME: home,
			},
			["security", "--sound", "stop"],
		);
		expect(r.code).toBe(0);
		const out = JSON.parse(r.stdout);
		expect(out.argv).toEqual(["hook", "kimi", "security", "--sound", "stop"]);
		expect(JSON.parse(out.stdin).tool_input.command).toBe("ls");
		expect(out.env.kimiHome).toBe(home);
		expect(out.env.kimiRoot).toBe("/virtual/plugin/root");
		expect(out.env.claudeRoot).toBeUndefined();
		expect(out.env.claudeDir).toBeUndefined();
		expect(out.env.claudeHome).toBeUndefined();
	});

	test("scope defaults to core when argv[2] is absent", () => {
		const home = makeHome(true);
		const r = runShim({ KIMI_CODE_HOME: home, HOME: home });
		expect(r.code).toBe(0);
		expect(JSON.parse(r.stdout).argv).toEqual(["hook", "kimi", "core"]);
	});

	test("$KIMI_HOME/.env overrides the inherited env (cross-harness pollution)", () => {
		const home = makeHome(true);
		writeFileSync(join(home, ".env"), 'FUSE_ENFORCE_TTL_SEC=480\nQUOTED_VAR="hello world"\n');
		// Ambient env simulates claude-env.fish exporting ~/.claude/.env values.
		const r = runShim({ KIMI_CODE_HOME: home, HOME: home, FUSE_ENFORCE_TTL_SEC: "120" });
		expect(r.code).toBe(0);
		const out = JSON.parse(r.stdout);
		expect(out.env.ttl).toBe("480");
		expect(out.env.quoted).toBe("hello world");
	});
});
