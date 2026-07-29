/**
 * summary.ts — Final report: per-step OK/SKIP/FAIL table, then the exact
 * manual commands the user must run in the Kimi Code TUI (plugin installs
 * are interactive-only, not scriptable headlessly).
 */
import type { InstallStepResult, MarketplaceFile } from "../../../src/interfaces/index.ts";

const STATUS_LABEL = { ok: "OK", skip: "SKIP", fail: "FAIL" } as const;

/** Print the per-step outcome table; returns true when every step passed. */
export function printSummary(results: InstallStepResult[], dryRun: boolean): boolean {
	console.log(`\n=== Install summary${dryRun ? " (DRY-RUN — nothing outside the repo was written)" : ""} ===`);
	for (const r of results) {
		const notes = r.notes.length > 0 ? ` (${r.notes.join("; ")})` : "";
		console.log(`${r.name.padEnd(22)} ${STATUS_LABEL[r.status]}${notes}`);
	}
	return results.every((r) => r.status !== "fail");
}

/** Print the manual /plugins commands and the reload reminder. */
export function printNextSteps(marketplacePath: string, marketplace: MarketplaceFile): void {
	console.log("\n=== Next steps (manual, in the Kimi Code TUI) ===");
	console.log("Plugin installs are interactive TUI commands — run them yourself:");
	console.log(`  /plugins marketplace ${marketplacePath}`);
	for (const p of marketplace.plugins) console.log(`  /plugins install ${p.id}`);
	console.log("Then run /reload (or start a new session) to apply.");
}
