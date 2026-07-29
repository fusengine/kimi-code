/**
 * experimental-flag.ts — Enable the v2 engine by default so custom agents
 * (~/.kimi-code/agents/*.md) are discovered: kimi's v1 engine never scans
 * them (custom agent files are v2-only until the v1 backport ships), and the
 * only switch is KIMI_CODE_EXPERIMENTAL_FLAG=1 in the kimi process env.
 * Kimi does NOT read $KIMI_HOME/.env — the export must land in the shell rc
 * (Claude-installer parity). TTY: clack confirm, default YES. Non-TTY: only
 * with the explicit FUSENGINE_EXPERIMENTAL_FLAG=1 opt-in, so CI/test runs
 * never touch the real shell rc. Idempotent: an existing export is kept.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import type { InstallContext, InstallStepResult } from "../../../src/interfaces/index.ts";
import { initUi, info, plan } from "./ui";

const FLAG = "KIMI_CODE_EXPERIMENTAL_FLAG";
const BEGIN = "# >>> fusengine kimi (v2 engine: custom agents) >>>";
const END = "# <<< fusengine kimi <<<";

/** Shell rc path + export line for the detected shell; null when unsupported. */
export function shellTarget(shell: string, home: string): { path: string; line: string } | null {
	const name = shell.split("/").pop() ?? "";
	if (name === "zsh") return { path: join(home, ".zshrc"), line: `export ${FLAG}=1` };
	if (name === "bash") return { path: join(home, ".bashrc"), line: `export ${FLAG}=1` };
	if (name === "fish") return { path: join(home, ".config", "fish", "config.fish"), line: `set -gx ${FLAG} 1` };
	return null;
}

/** Append the guarded export block to the rc file (creates it when missing). */
export async function writeFlagBlock(path: string, line: string): Promise<void> {
	const current = await Bun.file(path)
		.text()
		.catch(() => "");
	await Bun.write(path, `${current.replace(/\n*$/, "\n")}${BEGIN}\n${line}\n${END}\n`);
}

/** Propose/apply the default-on v2 engine flag in the user's shell rc. */
export async function configureExperimentalFlag(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "configureExperimentalFlag", status: "ok", notes: [] };
	const target = shellTarget(process.env.SHELL ?? "", homedir());
	if (!target) {
		res.status = "skip";
		res.notes.push(`unsupported shell: ${process.env.SHELL ?? "unknown"}`);
		return res;
	}
	const rc = await Bun.file(target.path)
		.text()
		.catch(() => "");
	if (rc.includes(FLAG)) {
		res.status = "skip";
		res.notes.push(`${FLAG} already in ${target.path}`);
		return res;
	}
	if (ctx.dryRun) {
		plan(`append ${FLAG}=1 to ${target.path} (v2 engine → custom agents)`);
		res.notes.push(`target: ${target.path}`);
		return res;
	}
	let apply = process.env.FUSENGINE_EXPERIMENTAL_FLAG === "1";
	const p = await initUi();
	if (p && process.stdin.isTTY) {
		const wants = await p.confirm({
			message: `Enable the v2 engine by default (${FLAG}=1 in ${target.path})? Required for custom agents.`,
			initialValue: true,
		});
		if (!p.isCancel(wants)) apply = wants;
	}
	if (!apply) {
		res.status = "skip";
		res.notes.push("declined — custom agents stay v2-gated");
		return res;
	}
	await writeFlagBlock(target.path, target.line);
	info(`${FLAG}=1 → ${target.path} (open a new shell or source it)`);
	res.notes.push(`flag → ${target.path}`);
	return res;
}
