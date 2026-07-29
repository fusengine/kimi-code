/**
 * install-permission-mode.test.mts — YOLO permission mode step.
 * TTY: clack select (untestable here). Non-TTY: FUSENGINE_PERMISSION_MODE
 * writes default_permission_mode into $KIMI_HOME/config.toml, preserving any
 * existing content; unset/invalid env values leave the file alone.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeHarness, makeRepo, runInstaller, tmp, write } from "./install-fixtures.mts";

function fixture() {
	const root = tmp("kimi-perm-mode-");
	const repo = join(root, "repo");
	const harness = join(root, "harness");
	makeRepo(repo);
	makeHarness(harness);
	return { repo, harness, home: join(root, "home") };
}

const configToml = (home: string) => readFileSync(join(home, "config.toml"), "utf8");

describe("install-kimi permission mode", () => {
	test("FUSENGINE_PERMISSION_MODE=yolo writes default_permission_mode", () => {
		const { repo, harness, home } = fixture();
		const r = runInstaller(home, repo, harness, ["--yes"], { FUSENGINE_PERMISSION_MODE: "yolo" });
		expect(r.code).toBe(0);
		expect(configToml(home)).toContain('default_permission_mode = "yolo"');
	});

	test("existing config.toml content is preserved, key replaced", () => {
		const { repo, harness, home } = fixture();
		write(join(home, "config.toml"), 'default_permission_mode = "manual"\ntelemetry = false\n');
		const r = runInstaller(home, repo, harness, ["--yes"], { FUSENGINE_PERMISSION_MODE: "yolo" });
		expect(r.code).toBe(0);
		const toml = configToml(home);
		expect(toml).toContain('default_permission_mode = "yolo"');
		expect(toml).toContain("telemetry = false");
		expect(toml).not.toContain('default_permission_mode = "manual"');
	});

	test("without the env override the step is a no-op", () => {
		const { repo, harness, home } = fixture();
		const env: Record<string, string> = {};
		delete process.env.FUSENGINE_PERMISSION_MODE;
		const r = runInstaller(home, repo, harness, ["--yes"], env);
		expect(r.code).toBe(0);
		// config.toml exists (hooks step) but carries no permission mode.
		expect(configToml(home)).not.toContain("default_permission_mode");
	});

	test("an invalid override warns and writes nothing", () => {
		const { repo, harness, home } = fixture();
		const r = runInstaller(home, repo, harness, ["--yes"], { FUSENGINE_PERMISSION_MODE: "yeet" });
		expect(r.code).toBe(0);
		expect(r.out).toContain("invalid 'yeet'");
		expect(configToml(home)).not.toContain("default_permission_mode");
	});
});

