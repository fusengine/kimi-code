/**
 * runner.ts — Orchestrate the install steps in order, collecting one
 * InstallStepResult per step. A throwing step is recorded as FAIL and the
 * run continues so the summary shows the full picture. marketplace.json is
 * always written (in-repo artifact) and returned for the summary.
 */
import type { InstallContext, InstallStepResult, MarketplaceFile, RunOutcome } from "../../../src/interfaces/index.ts";
import { backupExisting } from "./backup";
import { installRuntimeDeps } from "./runtime-deps";
import { installAgentsMd, mergeKimiRules } from "./agents-md";
import { mergeMcp } from "./mcp-merge";
import { promptMcpKeys } from "./mcp-key-prompt";
import { configureHarness } from "./harness-config";
import { installHooks } from "./hooks-config";
import { installAgents } from "./agents-install";
import { writeMarketplace } from "./marketplace";
import { warn } from "./ui";

/** Run one step, converting a throw into a FAIL result. */
async function runStep(
	results: InstallStepResult[],
	name: string,
	fn: () => Promise<InstallStepResult>,
): Promise<void> {
	console.log(`▸ ${name}`);
	try {
		results.push(await fn());
	} catch (e) {
		warn((e as Error).message);
		results.push({ name, status: "fail", notes: [(e as Error).message] });
	}
}

/** Execute steps 2–8 of the install plan in the mandated order. */
export async function runInstaller(ctx: InstallContext): Promise<RunOutcome> {
	const results: InstallStepResult[] = [];
	await runStep(results, "backup", () => backupExisting(ctx));
	await runStep(results, "installRuntimeDeps", () => installRuntimeDeps(ctx));
	await runStep(results, "installAgentsMd", () => installAgentsMd(ctx));
	// After installAgentsMd, never before: the copy can overwrite AGENTS.md
	// wholesale, which would wipe a rules block merged earlier.
	await runStep(results, "mergeKimiRules", () => mergeKimiRules(ctx));
	await runStep(results, "promptMcpKeys", () => promptMcpKeys(ctx));
	await runStep(results, "mergeMcp", () => mergeMcp(ctx));
	await runStep(results, "configureHarness", () => configureHarness(ctx));
	await runStep(results, "installHooks", () => installHooks(ctx));
	await runStep(results, "installAgents", () => installAgents(ctx));
	console.log("▸ writeMarketplace");
	let marketplace: MarketplaceFile = { version: "2", plugins: [] };
	let marketplacePath = "";
	try {
		const out = await writeMarketplace(ctx);
		marketplace = out.file;
		marketplacePath = out.path;
		results.push(out.res);
	} catch (e) {
		warn((e as Error).message);
		results.push({ name: "writeMarketplace", status: "fail", notes: [(e as Error).message] });
	}
	return { results, marketplace, marketplacePath };
}
