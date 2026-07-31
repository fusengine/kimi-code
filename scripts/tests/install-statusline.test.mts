/**
 * install-statusline.test.mts — native TUI statusline step.
 * The installer copies core-guards' statusline-native.mjs into
 * $KIMI_HOME/bin/ and upserts [status_line].command in tui.toml,
 * preserving every other line/section; a second run stays idempotent.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { makeHarness, makeRepo, runInstaller, tmp, write } from "./install-fixtures.mts";
import { withStatusLineCommand } from "../lib/install/statusline.ts";

const SCRIPT = "#!/usr/bin/env bun\n// fake native statusline\n";

function fixture() {
	const root = tmp("kimi-statusline-");
	const repo = join(root, "repo");
	const harness = join(root, "harness");
	makeRepo(repo);
	makeHarness(harness);
	write(join(repo, "plugins", "core-guards", "statusline", "native", "statusline-native.mjs"), SCRIPT);
	return { repo, harness, home: join(root, "home") };
}

const tuiToml = (home: string) => readFileSync(join(home, "tui.toml"), "utf8");
const occurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

describe("install-kimi statusline", () => {
	test("deploys the script to bin/ and wires [status_line] in tui.toml", () => {
		const { repo, harness, home } = fixture();
		const r = runInstaller(home, repo, harness, ["--yes"]);
		expect(r.code).toBe(0);
		const dest = join(home, "bin", "statusline-native.mjs");
		expect(existsSync(dest)).toBe(true);
		expect(readFileSync(dest, "utf8")).toBe(SCRIPT);
		expect(tuiToml(home)).toContain(`[status_line]\ncommand = "${dest}"`);
	});

	test("existing tui.toml content is preserved, command replaced", () => {
		const { repo, harness, home } = fixture();
		write(join(home, "tui.toml"), '[status_line]\ncommand = "/old/path.mjs"\n\n[thinking]\neffort = "high"\n');
		const r = runInstaller(home, repo, harness, ["--yes"]);
		expect(r.code).toBe(0);
		const toml = tuiToml(home);
		expect(toml).toContain(`command = "${join(home, "bin", "statusline-native.mjs")}"`);
		expect(toml).toContain('[thinking]\neffort = "high"');
		expect(toml).not.toContain("/old/path.mjs");
	});

	test("a second run is idempotent — no duplicate section", () => {
		const { repo, harness, home } = fixture();
		expect(runInstaller(home, repo, harness, ["--yes"]).code).toBe(0);
		expect(runInstaller(home, repo, harness, ["--yes"]).code).toBe(0);
		const toml = tuiToml(home);
		expect(occurrences(toml, "[status_line]")).toBe(1);
		expect(occurrences(toml, "command = ")).toBe(1);
	});
});

describe("withStatusLineCommand (surgical upsert)", () => {
	test("creates a minimal file from empty input", () => {
		expect(withStatusLineCommand("", "/h/bin/s.mjs")).toBe('[status_line]\ncommand = "/h/bin/s.mjs"\n');
	});

	test("appends after existing sections with a blank separator", () => {
		const out = withStatusLineCommand('[thinking]\neffort = "high"\n', "/h/bin/s.mjs");
		expect(out).toBe('[thinking]\neffort = "high"\n\n[status_line]\ncommand = "/h/bin/s.mjs"\n');
	});

	test("replaces only the command line inside [status_line]", () => {
		const toml = '[status_line]\ncommand = "/old.mjs" # note\n\n[thinking]\neffort = "high"\n';
		const out = withStatusLineCommand(toml, "/new.mjs");
		expect(out).toContain('[status_line]\ncommand = "/new.mjs"');
		expect(out).toContain('[thinking]\neffort = "high"');
		expect(out).not.toContain("/old.mjs");
	});

	test("a command key in another section is left untouched", () => {
		const toml = '[hooks]\ncommand = "echo mine"\n';
		const out = withStatusLineCommand(toml, "/new.mjs");
		expect(out).toContain('[hooks]\ncommand = "echo mine"');
		expect(occurrences(out, "[status_line]")).toBe(1);
	});

	test("a header with a trailing comment is matched, not duplicated", () => {
		const toml = '[status_line] # native statusline\ncommand = "/old.mjs"\n';
		const out = withStatusLineCommand(toml, "/new.mjs");
		expect(out).toContain("[status_line] # native statusline");
		expect(out).toContain('command = "/new.mjs"');
		expect(occurrences(out, "[status_line]")).toBe(1);
	});
});
