/**
 * permission-mode.ts — Propose the default permission mode (YOLO ON/OFF) and
 * persist it as `default_permission_mode` in $KIMI_HOME/config.toml.
 * TTY: clack select seeded with the current value. Non-TTY: the explicit
 * FUSENGINE_PERMISSION_MODE=yolo|manual|auto override, else the step is a
 * no-op — an existing config value is never clobbered without a choice.
 * The write is a surgical line edit: every other key/section of config.toml
 * is preserved verbatim. Dry-run never prompts and never writes.
 */
import { join } from "node:path";
import type { InstallContext, InstallStepResult } from "../../../src/interfaces/index.ts";
import { initUi, info, plan, warn } from "./ui";

const MODES = ["manual", "yolo", "auto"] as const;
type PermissionMode = (typeof MODES)[number];
// Scoped to the root table: a same-named key under a [table]/[[hooks]] header
// belongs to that table — kimi reads default_permission_mode at the root only
// (toml.io: the root table ends at the first table header).
const KEY_RE = /^(default_permission_mode\s*=\s*)"[^"]*"(.*)$/m;
const VALUE_RE = /^default_permission_mode\s*=\s*"([a-z]+)"/m;

/** Split at the first table header; top-level keys live in `head` only. */
function topLevel(toml: string): { head: string; rest: string } {
	const m = toml.match(/^\[/m);
	return m?.index !== undefined ? { head: toml.slice(0, m.index), rest: toml.slice(m.index) } : { head: toml, rest: "" };
}

/** Current top-level default_permission_mode, or undefined when unset/unreadable. */
export async function currentPermissionMode(path: string): Promise<string | undefined> {
	try {
		return topLevel(await Bun.file(path).text()).head.match(VALUE_RE)?.[1];
	} catch {
		return undefined;
	}
}

/** Upsert the top-level key, preserving every other line and trailing comments. */
export function withPermissionMode(toml: string, mode: PermissionMode): string {
	const { head, rest } = topLevel(toml);
	if (KEY_RE.test(head)) return head.replace(KEY_RE, `$1"${mode}"$2`) + rest;
	// Top-level keys must precede any [table] header: prepend in the head.
	return `default_permission_mode = "${mode}"\n${head}${rest}`;
}

/** Non-interactive mode from FUSENGINE_PERMISSION_MODE; undefined when unset/invalid. */
function envMode(): PermissionMode | undefined {
	const raw = process.env.FUSENGINE_PERMISSION_MODE;
	if (raw === undefined) return undefined;
	if ((MODES as readonly string[]).includes(raw)) return raw as PermissionMode;
	warn(`FUSENGINE_PERMISSION_MODE: invalid '${raw}' — expected ${MODES.join("|")}`);
	return undefined;
}

/** Ask (TTY) or read the env override, then persist the chosen mode. */
export async function configurePermissionMode(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "configurePermissionMode", status: "ok", notes: [] };
	const path = join(ctx.kimiHome, "config.toml");
	const current = (await currentPermissionMode(path)) ?? "manual";
	if (ctx.dryRun) {
		plan(`propose YOLO mode (current default_permission_mode: ${current})`);
		res.notes.push(`current: ${current}`);
		return res;
	}
	const p = await initUi();
	let mode: PermissionMode | undefined;
	if (p && process.stdin.isTTY) {
		const picked = await p.select({
			message: "YOLO mode (auto-approve tool actions)?",
			options: [
				{ value: "manual", label: "OFF — manual (ask before tool actions)" },
				{ value: "yolo", label: "ON — yolo (auto-approve tool actions)" },
			],
			initialValue: current === "yolo" ? "yolo" : "manual",
		});
		if (!p.isCancel(picked)) mode = picked as PermissionMode;
	} else {
		mode = envMode();
	}
	if (!mode) {
		res.status = "skip";
		res.notes.push(`kept: ${current}`);
		return res;
	}
	const toml = await Bun.file(path)
		.text()
		.catch(() => "");
	await Bun.write(path, withPermissionMode(toml, mode));
	info(`default_permission_mode = "${mode}" → config.toml`);
	res.notes.push(`mode: ${mode}`);
	return res;
}
