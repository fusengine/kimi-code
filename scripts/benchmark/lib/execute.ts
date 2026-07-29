/** Executes one CLI × fixture benchmark run and writes results + logs. */
import { mkdtempSync, cpSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RunResult, FixtureDef } from "./interfaces/types";
import { sh, parseTestCounts, gitDelta } from "./shell";

/** Copies the fixture, baselines it in git, runs the CLI headless, then measures. */
export async function runOne(cli: "kimi" | "claude", key: string, fx: FixtureDef, here: string): Promise<RunResult> {
  const srcDir = join(here, "fixtures", fx.dir);
  const work = mkdtempSync(join(tmpdir(), `bench-${cli}-f${key}-`));
  cpSync(srcDir, work, { recursive: true });
  const prompt = readFileSync(join(srcDir, "prompt.md"), "utf8");
  sh(["git", "init", "-q"], work);
  sh(["git", "add", "-A"], work);
  sh(["git", "-c", "user.email=bench@local", "-c", "user.name=bench", "commit", "-qm", "baseline"], work);

  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const cmd = cli === "kimi"
    ? ["kimi", "-p", prompt]
    : ["claude", "-p", prompt, "--dangerously-skip-permissions"];
  const run = sh(cmd, work, 600_000);
  const durationMs = Date.now() - t0;

  const counts = parseTestCounts(sh(["bun", "test"], work).out);
  const { changed, newFiles } = gitDelta(work);
  const violations: string[] = [];
  const testsModified = [...changed, ...newFiles].some((f) => f.startsWith("tests/"));
  if (testsModified) violations.push("tests/ modified (forbidden)");
  if (fx.expectNew && !existsSync(join(work, fx.expectNew))) violations.push(`expected new file missing: ${fx.expectNew}`);
  if (counts.fail === -1) violations.push("could not parse test output");

  const result: RunResult = {
    cli, fixture: fx.dir, startedAt, durationMs,
    exitCode: run.code, timedOut: run.timedOut,
    testsPass: counts.pass, testsFail: counts.fail,
    success: counts.fail === 0 && violations.length === 0,
    testsModified, filesChanged: changed, newFiles, violations,
  };
  const outDir = join(here, "results");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${cli}-f${key}.json`), JSON.stringify(result, null, 2));
  writeFileSync(join(outDir, `${cli}-f${key}.log`), `=== CLI ===\n${run.out}\n\n=== TESTS ===\n${sh(["bun", "test"], work).out}`);
  if (!process.argv.includes("--keep")) sh(["rm", "-rf", work], "/");
  return result;
}
