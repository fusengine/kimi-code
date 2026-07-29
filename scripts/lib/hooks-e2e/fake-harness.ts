/**
 * fake-harness.ts — Layer 2: a hermetic harness bin that records argv, stdin
 * and the passthrough KIMI_* env (plus CLAUDE_* to prove no synthesis) to
 * $FAKE_HARNESS_RECORD; exits with the code in $FAKE_HARNESS_EXIT.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { FakeHarnessRecord, ShimCommand, ShimRun } from "../../../src/interfaces/index.ts";

const BIN_REL = join("node_modules", "@fusengine", "harness", "dist", "cli", "bin.mjs");

/** The fake bin: reads stdin fully, writes the record, exits FAKE_HARNESS_EXIT. */
const FAKE_BIN = [
	'import { writeFileSync } from "node:fs";',
	'let d = "";',
	'process.stdin.setEncoding("utf8");',
	'process.stdin.on("data", (c) => (d += c));',
	'process.stdin.on("end", () => {',
	"  writeFileSync(process.env.FAKE_HARNESS_RECORD, JSON.stringify({",
	"    argv: process.argv.slice(2),",
	"    stdin: d,",
	"    env: {",
	"      KIMI_CODE_HOME: process.env.KIMI_CODE_HOME,",
	"      KIMI_PLUGIN_ROOT: process.env.KIMI_PLUGIN_ROOT,",
	"      CLAUDE_PLUGIN_ROOT: process.env.CLAUDE_PLUGIN_ROOT,",
	"      CLAUDE_PROJECT_DIR: process.env.CLAUDE_PROJECT_DIR, CLAUDE_HOME: process.env.CLAUDE_HOME,",
	"    },",
	"  }));",
	'  process.exit(Number(process.env.FAKE_HARNESS_EXIT ?? "0"));',
	"});",
].join("\n");

/** Scaffold a fake KIMI_CODE_HOME with the recording harness bin; returns the record path. */
export function makeFakeHarnessHome(home: string): string {
	const bin = join(home, BIN_REL);
	mkdirSync(join(bin, ".."), { recursive: true });
	writeFileSync(bin, FAKE_BIN);
	return join(home, "record.json");
}

/** Run a plugin shim with a raw payload string; reads back the fake-harness record. */
export function runShim(
	shim: string,
	cmd: ShimCommand,
	payload: string,
	env: Record<string, string>,
): ShimRun {
	// Strip ambient CLAUDE_* so "no synthesis" assertions stay hermetic.
	const base = { ...(process.env as Record<string, string>) };
	delete base.CLAUDE_PLUGIN_ROOT;
	delete base.CLAUDE_PROJECT_DIR;
	delete base.CLAUDE_HOME;
	const proc = spawnSync("bun", [shim, cmd.scope, ...cmd.args], {
		input: payload,
		env: { ...base, ...env },
		encoding: "utf8",
	});
	const run: ShimRun = { code: proc.status ?? 1, stdout: proc.stdout, stderr: proc.stderr };
	const recordPath = env.FAKE_HARNESS_RECORD;
	if (recordPath && existsSync(recordPath)) {
		run.record = JSON.parse(readFileSync(recordPath, "utf8")) as FakeHarnessRecord;
	}
	return run;
}

/** Violations of the native contract: argv, verbatim stdin, KIMI_* passthrough, no CLAUDE_* synthesis. */
export function forwardProblems(
	run: ShimRun,
	cmd: ShimCommand,
	payload: string,
	pluginRoot: string,
	kimiHome: string,
): string[] {
	const problems: string[] = [];
	const rec = run.record;
	if (!rec) return ["fake harness wrote no record (bin not reached)"];
	const wantArgv = ["hook", "kimi", cmd.scope, ...cmd.args];
	if (JSON.stringify(rec.argv) !== JSON.stringify(wantArgv)) {
		problems.push(`argv ${JSON.stringify(rec.argv)} != ${JSON.stringify(wantArgv)}`);
	}
	if (rec.stdin !== payload) problems.push("stdin not forwarded verbatim");
	if (rec.env.KIMI_PLUGIN_ROOT !== pluginRoot) problems.push("KIMI_PLUGIN_ROOT not passed through");
	if (rec.env.KIMI_CODE_HOME !== kimiHome) problems.push("KIMI_CODE_HOME not passed through");
	for (const v of ["CLAUDE_PLUGIN_ROOT", "CLAUDE_PROJECT_DIR", "CLAUDE_HOME"]) {
		if (rec.env[v] !== undefined) problems.push(`shim synthesized ${v}=${rec.env[v]}`);
	}
	return problems;
}
