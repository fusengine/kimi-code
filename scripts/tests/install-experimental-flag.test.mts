/**
 * install-experimental-flag.test.mts — v2 engine flag step.
 * Non-TTY applies only with FUSENGINE_EXPERIMENTAL_FLAG=1 (never touches the
 * real shell rc otherwise): the guarded export block lands in the fake-HOME
 * rc, is idempotent across runs, and unsupported shells are skipped.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { makeHarness, makeRepo, runInstaller, tmp } from "./install-fixtures.mts";
import { shellTarget, writeFlagBlock } from "../lib/install/experimental-flag.ts";

function fixture() {
	const root = tmp("kimi-exp-flag-");
	const repo = join(root, "repo");
	const harness = join(root, "harness");
	makeRepo(repo);
	makeHarness(harness);
	return { repo, harness, home: join(root, "home"), fakeOsHome: join(root, "oshome") };
}

const FLAG_ENV = { FUSENGINE_EXPERIMENTAL_FLAG: "1", SHELL: "/bin/zsh" };

describe("install-kimi experimental flag", () => {
	test("opt-in appends the guarded export to the shell rc", () => {
		const { repo, harness, home, fakeOsHome } = fixture();
		const r = runInstaller(home, repo, harness, ["--yes"], { ...FLAG_ENV, HOME: fakeOsHome });
		expect(r.code).toBe(0);
		const rc = readFileSync(join(fakeOsHome, ".zshrc"), "utf8");
		expect(rc).toContain("export KIMI_CODE_EXPERIMENTAL_FLAG=1");
		expect(rc).toContain("# >>> fusengine kimi");
	});

	test("a second run does not duplicate the block", () => {
		const { repo, harness, home, fakeOsHome } = fixture();
		runInstaller(home, repo, harness, ["--yes"], { ...FLAG_ENV, HOME: fakeOsHome });
		const r = runInstaller(home, repo, harness, ["--yes"], { ...FLAG_ENV, HOME: fakeOsHome });
		expect(r.code).toBe(0);
		expect(r.out).toContain("already in");
		const rc = readFileSync(join(fakeOsHome, ".zshrc"), "utf8");
		expect(rc.split("KIMI_CODE_EXPERIMENTAL_FLAG").length - 1).toBe(1); // export line only
	});

	test("without the opt-in the shell rc is left alone", () => {
		const { repo, harness, home, fakeOsHome } = fixture();
		const r = runInstaller(home, repo, harness, ["--yes"], { HOME: fakeOsHome, SHELL: "/bin/zsh" });
		expect(r.code).toBe(0);
		expect(existsSync(join(fakeOsHome, ".zshrc"))).toBe(false);
	});

	test("an unsupported shell skips the step", () => {
		const { repo, harness, home, fakeOsHome } = fixture();
		const r = runInstaller(home, repo, harness, ["--yes"], {
			...FLAG_ENV,
			HOME: fakeOsHome,
			SHELL: "/bin/tcsh",
		});
		expect(r.code).toBe(0);
		expect(r.out).toContain("unsupported shell");
	});
});

describe("shellTarget", () => {
	test("zsh/bash export, fish set -gx, others unsupported", () => {
		expect(shellTarget("/bin/zsh", "/h")?.line).toBe("export KIMI_CODE_EXPERIMENTAL_FLAG=1");
		expect(shellTarget("/usr/local/bin/bash", "/h")?.path).toBe("/h/.bashrc");
		expect(shellTarget("/opt/homebrew/bin/fish", "/h")).toEqual({
			path: "/h/.config/fish/config.fish",
			line: "set -gx KIMI_CODE_EXPERIMENTAL_FLAG 1",
		});
		expect(shellTarget("/bin/tcsh", "/h")).toBeNull();
	});
});

describe("writeFlagBlock", () => {
	test("self-idempotent and no leading blank line on a fresh file", async () => {
		const p = join(tmp("kimi-flag-unit-"), ".zshrc");
		await writeFlagBlock(p, "export KIMI_CODE_EXPERIMENTAL_FLAG=1");
		await writeFlagBlock(p, "export KIMI_CODE_EXPERIMENTAL_FLAG=1");
		const rc = readFileSync(p, "utf8");
		expect(rc.split(">>> fusengine kimi").length - 1).toBe(1);
		expect(rc.startsWith("\n")).toBe(false);
		expect(rc).toContain("export KIMI_CODE_EXPERIMENTAL_FLAG=1");
	});
});
