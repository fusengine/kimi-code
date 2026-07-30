/**
 * install-permission-mode-regression.test.ts — Guards the VALUE_RE `/m`
 * regression: without the multiline flag, `^` anchors to the start of the
 * string, so reading default_permission_mode failed whenever another
 * top-level key preceded it (and replacing a non-first-line key silently
 * prepended a duplicate instead).
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { tmp, write } from "./install-fixtures.mts";
import { currentPermissionMode, withPermissionMode } from "../lib/install/permission-mode.ts";

/** Write `toml` to a fresh config.toml and return its path. */
function configWith(toml: string): string {
	const p = join(tmp("kimi-perm-regex-"), "config.toml");
	write(p, toml);
	return p;
}

describe("currentPermissionMode (VALUE_RE multiline)", () => {
	test("reads the mode when another top-level key precedes it", async () => {
		const p = configWith('theme = "dark"\ndefault_permission_mode = "yolo"\n');
		expect(await currentPermissionMode(p)).toBe("yolo");
	});

	test("reads the mode with several preceding keys and a following section", async () => {
		const p = configWith('theme = "dark"\ntelemetry = false\ndefault_permission_mode = "auto"\n[thinking]\nenabled = true\n');
		expect(await currentPermissionMode(p)).toBe("auto");
	});

	test("still ignores a section-scoped key after preceding top-level keys", async () => {
		const p = configWith('theme = "dark"\n[[hooks]]\ndefault_permission_mode = "yolo"\n');
		expect(await currentPermissionMode(p)).toBeUndefined();
	});
});

describe("withPermissionMode (KEY_RE multiline)", () => {
	test("replaces in place when the key is not on the first line", () => {
		const toml = 'theme = "dark"\ndefault_permission_mode = "manual"\ntelemetry = false\n';
		const out = withPermissionMode(toml, "yolo");
		expect(out).toBe('theme = "dark"\ndefault_permission_mode = "yolo"\ntelemetry = false\n');
		expect(out.match(/default_permission_mode/g)?.length).toBe(1);
	});
});
