/**
 * backup.ts — Snapshot existing $KIMI_HOME config files before any mutation.
 * Each of config.toml / AGENTS.md / mcp.json, when present, is copied to
 * `<file>.bak-<ISOtimestamp>` (colons/dots sanitized). --yes mode only.
 */
import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import { exists } from "../fs-exists";
import type { InstallContext, InstallStepResult } from "../../../src/interfaces/index.ts";
import { plan, info } from "./ui";

const FILES = ["config.toml", "AGENTS.md", "mcp.json"];

/** Filesystem-safe ISO timestamp: 2026-07-27T19-52-08-908Z. */
export function isoStamp(now = new Date()): string {
	return now.toISOString().replace(/[:.]/g, "-");
}

/** Back up the mutable $KIMI_HOME files we are about to touch. */
export async function backupExisting(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "backup", status: "ok", notes: [] };
	const stamp = isoStamp();
	let count = 0;
	for (const file of FILES) {
		const src = join(ctx.kimiHome, file);
		if (!(await exists(src))) continue;
		const dest = `${src}.bak-${stamp}`;
		if (ctx.dryRun) {
			plan(`backup ${src} → ${dest}`);
		} else {
			await copyFile(src, dest);
			info(`backed up ${file} → ${dest}`);
		}
		count++;
	}
	if (count === 0) {
		res.status = "skip";
		res.notes.push("nothing to back up");
		if (!ctx.dryRun) info("no existing config files — nothing to back up");
	} else {
		res.notes.push(`${count} file(s)`);
	}
	return res;
}
