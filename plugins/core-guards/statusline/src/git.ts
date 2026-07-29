/** Git segment data for the session's workDir (branch + dirty file count). */
import { spawnSync } from "node:child_process";
import type { GitInfo } from "./interfaces/types";

/** Runs a git command in dir; empty string on any failure. */
function git(dir: string, args: string[]): string {
	const r = spawnSync("git", args, { cwd: dir, encoding: "utf8", timeout: 5000 });
	return r.status === 0 ? r.stdout.trim() : "";
}

/** Branch name (or short SHA when detached) + count of modified files. */
export function gitInfo(dir: string): GitInfo | null {
	const branch = git(dir, ["rev-parse", "--abbrev-ref", "HEAD"]);
	if (!branch) return null;
	const head = branch === "HEAD" ? git(dir, ["rev-parse", "--short", "HEAD"]) : branch;
	const dirty = git(dir, ["status", "--porcelain"]).split("\n").filter(Boolean).length;
	return { branch: head, dirty };
}
