/**
 * Benchmark runner — executes fixtures under a CLI headlessly and measures outcomes.
 * Usage: bun run scripts/benchmark/run.ts --cli=kimi|claude|both [--fixture=1|2|3|all] [--keep]
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { FixtureDef, RunResult } from "./lib/interfaces/types";
import { runOne } from "./lib/execute";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES: Record<string, FixtureDef> = {
  "1": { dir: "1-codegen", expectNew: "src/pool.ts" },
  "2": { dir: "2-refactor", expectNew: "src/pricing.ts" },
  "3": { dir: "3-debug" },
};

const arg = (name: string, dflt: string) =>
  (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split("=")[1];
const clis: Array<"kimi" | "claude"> = arg("cli", "both") === "both" ? ["kimi", "claude"] : [arg("cli", "both") as "kimi" | "claude"];
const fixtures = arg("fixture", "all") === "all" ? Object.keys(FIXTURES) : [arg("fixture", "all")];

const results: RunResult[] = [];
for (const cli of clis) {
  for (const f of fixtures) {
    console.log(`\n>>> ${cli} × fixture ${f} (${FIXTURES[f].dir})`);
    const r = await runOne(cli, f, FIXTURES[f], HERE);
    results.push(r);
    const files = [...r.filesChanged, ...r.newFiles].join(", ") || "none";
    console.log(`    ${r.success ? "SUCCESS" : "FAIL"} — ${r.testsPass}p/${r.testsFail}f, ${(r.durationMs / 1000).toFixed(0)}s, files: ${files}${r.violations.length ? `, VIOLATIONS: ${r.violations.join("; ")}` : ""}`);
  }
}

console.log("\n=== SUMMARY ===");
for (const r of results) {
  console.log(`${r.cli.padEnd(7)} ${r.fixture.padEnd(12)} ${r.success ? "OK " : "KO "} ${r.testsPass}p/${r.testsFail}f ${(r.durationMs / 1000).toFixed(0)}s`);
}
process.exit(results.every((r) => r.success) ? 0 : 1);
