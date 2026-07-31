/**
 * statusline.ts — Ship the native TUI statusline: copy core-guards'
 * statusline-native.mjs into $KIMI_HOME/bin/ and point tui.toml's
 * [status_line] command at it. The TOML edit is surgical: every other
 * line/section is preserved, the section is appended at EOF when absent,
 * and an existing [status_line] command is replaced in place (idempotent).
 * tui.toml is created when missing. Kimi < 0.30 ignores [status_line], so
 * the write is harmless on older CLIs. Dry-run plans only, never writes.
 */
import { chmod, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { InstallContext, InstallStepResult } from "../../../src/interfaces/index.ts";
import { info, plan } from "./ui";

const SCRIPT = "statusline-native.mjs";
const HEADER_RE = /^\[status_line\]\s*(#.*)?$/;
const ANY_HEADER_RE = /^\[/;
const COMMAND_RE = /^command\s*=/;

/** Repo path of the statusline script shipped by core-guards. */
export function statuslineSource(ctx: InstallContext): string {
	return join(ctx.pluginsRoot, "core-guards", "statusline", "native", SCRIPT);
}

/** Upsert [status_line].command, preserving every other line and section. */
export function withStatusLineCommand(toml: string, command: string): string {
	const line = `command = "${command}"`;
	const lines = toml.split("\n");
	const start = lines.findIndex((l) => HEADER_RE.test(l));
	if (start === -1) {
		const body = toml.replace(/\n*$/, "");
		return `${body ? `${body}\n\n` : ""}[status_line]\n${line}\n`;
	}
	let end = lines.length;
	for (let i = start + 1; i < lines.length; i++) {
		if (ANY_HEADER_RE.test(lines[i])) {
			end = i;
			break;
		}
	}
	const cmd = lines.findIndex((l, i) => i > start && i < end && COMMAND_RE.test(l));
	if (cmd === -1) lines.splice(start + 1, 0, line);
	else lines[cmd] = line;
	return lines.join("\n");
}

/** Deploy statusline-native.mjs into $KIMI_HOME/bin and wire it in tui.toml. */
export async function installStatusline(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "installStatusline", status: "ok", notes: [] };
	const dest = join(ctx.kimiHome, "bin", SCRIPT);
	const tui = join(ctx.kimiHome, "tui.toml");
	const src = Bun.file(statuslineSource(ctx));
	if (!(await src.exists())) {
		res.status = "skip";
		res.notes.push(`source missing: ${statuslineSource(ctx)}`);
		return res;
	}
	if (ctx.dryRun) {
		plan(`copy ${SCRIPT} → ${dest}`);
		plan(`set [status_line].command = "${dest}" in ${tui}`);
		res.notes.push(`target: ${dest}`);
		return res;
	}
	await mkdir(join(ctx.kimiHome, "bin"), { recursive: true });
	await Bun.write(dest, src);
	await chmod(dest, 0o755); // tui runs the command directly — keep it executable.
	res.notes.push(`script → ${dest}`);
	const toml = await Bun.file(tui)
		.text()
		.catch(() => "");
	await Bun.write(tui, withStatusLineCommand(toml, dest));
	info(`[status_line] command = "${dest}" → tui.toml`);
	res.notes.push("tui.toml: [status_line] command set");
	return res;
}
