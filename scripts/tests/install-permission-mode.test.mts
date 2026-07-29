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
import { currentPermissionMode, withPermissionMode } from "../lib/install/permission-mode.ts";

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

describe("withPermissionMode (root-table scoping)", () => {
	test("a section-scoped key is untouched; the top-level key is written", () => {
		const toml = '[[hooks]]\nevent = "Stop"\ndefault_permission_mode = "manual"\n';
		const out = withPermissionMode(toml, "yolo");
		expect(out.startsWith('default_permission_mode = "yolo"\n')).toBe(true);
		expect(out).toContain('[[hooks]]\nevent = "Stop"\ndefault_permission_mode = "manual"');
	});

	test("a top-level replace keeps trailing comments and sections", () => {
		const toml = 'default_permission_mode = "manual" # user note\ntelemetry = false\n[thinking]\nenabled = true\n';
		const out = withPermissionMode(toml, "yolo");
		expect(out).toContain('default_permission_mode = "yolo" # user note');
		expect(out).toContain("telemetry = false");
		expect(out).toContain("[thinking]");
		expect(out).not.toContain('"manual"');
	});

	test("currentPermissionMode reads the root table only", async () => {
		const dir = tmp("kimi-perm-unit-");
		const p = join(dir, "config.toml");
		write(p, '[[hooks]]\ndefault_permission_mode = "yolo"\n');
		expect(await currentPermissionMode(p)).toBeUndefined();
		write(p, 'default_permission_mode = "auto"\n[[hooks]]\nevent = "Stop"\n');
		expect(await currentPermissionMode(p)).toBe("auto");
	});
});

