/** Shell helpers for the benchmark runner (synchronous, captured output). */
import type { ShResult } from "./interfaces/types";

/** Runs a command synchronously in `cwd`, capturing stdout+stderr, with a timeout. */
export function sh(cmd: string[], cwd: string, timeoutMs = 120_000): ShResult {
  const p = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe", timeout: timeoutMs });
  return {
    code: p.exitCode,
    out: `${p.stdout.toString()}\n${p.stderr.toString()}`,
    timedOut: p.exitedDueToTimeout ?? false,
  };
}

/** Extracts bun-test pass/fail counts from output; fail = -1 when unparseable. */
export function parseTestCounts(out: string): { pass: number; fail: number } {
  const pass = /(\d+)\s+pass/.exec(out);
  const fail = /(\d+)\s+fail/.exec(out);
  return { pass: pass ? Number(pass[1]) : 0, fail: fail ? Number(fail[1]) : -1 };
}

/** Lists files changed vs HEAD and untracked files in a git worktree. */
export function gitDelta(work: string): { changed: string[]; newFiles: string[] } {
  const diff = sh(["git", "diff", "--name-only", "HEAD"], work);
  const untracked = sh(["git", "ls-files", "--others", "--exclude-standard"], work);
  const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
  return { changed: lines(diff.out), newFiles: lines(untracked.out) };
}
