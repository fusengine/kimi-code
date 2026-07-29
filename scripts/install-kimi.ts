#!/usr/bin/env bun
/**
 * install-kimi.ts — Fusengine Kimi Code plugins installer.
 *
 * Steps: backup → installRuntimeDeps (harness) → installAgentsMd →
 * mergeKimiRules (fences) → selectMcpServers → promptMcpKeys → mergeMcp →
 * configureHarness → installHooks → installAgents → writeMarketplace →
 * summary → assertInstalledState (--yes only).
 *
 * Flags: --yes (write; default is --dry-run) · --skip-env (ignore
 * $KIMI_HOME/.env for ${VAR} resolution) · --skip-mcp · --verbose.
 * Env overrides: KIMI_CODE_HOME (target, default ~/.kimi-code),
 * KIMI_PLUGINS_ROOT (plugins dir; tests point it at a synthetic repo),
 * FUSENGINE_HARNESS_SRC (harness source dir override),
 * FUSENGINE_MCP_SERVERS (non-TTY MCP allowlist, comma-separated).
 * Dry-run writes nothing outside the repo except marketplace.json (in-repo).
 * TTY runs use @clack/prompts; non-TTY keeps the plain console output.
 */
import { buildContext, parseFlags, preflight } from "./lib/install/preflight";
import { runInstaller } from "./lib/install/runner";
import { assertInstalledState } from "./lib/install/assert-state";
import { printNextSteps, printSummary } from "./lib/install/summary";
import { initUi, info } from "./lib/install/ui";

async function main(): Promise<number> {
	const ctx = buildContext(import.meta.dir, parseFlags(process.argv.slice(2)));
	const mode = ctx.dryRun ? "DRY-RUN (pass --yes to apply)" : "APPLYING CHANGES";
	const p = await initUi();
	if (p) {
		p.intro("Fusengine Kimi Code Plugins Setup");
		info(`mode: ${mode}`);
	} else {
		console.log(`Fusengine Kimi Code Plugins Setup — ${mode}`);
	}
	await preflight(ctx);
	const outcome = await runInstaller(ctx);
	const clean = await printSummary(outcome.results, ctx.dryRun);
	let assertFailures: string[] = [];
	if (!ctx.dryRun) {
		assertFailures = await assertInstalledState(ctx);
		for (const f of assertFailures) console.error(`  ✖ ${f}`);
		if (assertFailures.length === 0) {
			if (p) p.log.success("Installed state verified");
			else console.log("\nInstalled state verified ✔");
		}
	}
	await printNextSteps(ctx.repoRoot, ctx.kimiHome);
	if (p) p.outro("Setup complete — run the /plugins commands above, then /reload.");
	return clean && assertFailures.length === 0 ? 0 : 1;
}

main()
	.then((code) => process.exit(code))
	.catch((e) => {
		console.error(`fatal: ${(e as Error).message}`);
		process.exit(1);
	});
