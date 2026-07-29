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
const KEY_RE = /^default_permission_mode\s*=.*$/m;
const VALUE_RE = /^default_permission_mode\s*=\s*"([a-z]+)"\s*$/m;

/** Current top-level default_permission_mode, or undefined when unset/unreadable. */
export async function currentPermissionMode(path: string): Promise<string | undefined> {
	try {
		return (await Bun.file(path).text()).match(VALUE_RE)?.[1];
	} catch {
		return undefined;
	}
}

/** Upsert the top-level key, preserving every other line verbatim. */
export function withPermissionMode(toml: string, mode: PermissionMode): string {
	const line = `default_permission_mode = "${mode}"`;
	if (KEY_RE.test(toml)) return toml.replace(KEY_RE, line);
	// Top-level keys must precede any [table] header: prepend at the very top.
	return `${line}\n${toml}`;
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
