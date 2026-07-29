/**
 * summary.ts — Final report: per-step OK/SKIP/FAIL table, then post-install
 * guidance adapted to where the installer ran from (managed copy vs clone).
 */
import { join } from "node:path";
import type { InstallStepResult } from "../../../src/interfaces/index.ts";

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

/** Print the post-install guidance, adapted to where the installer ran from. */
export function printNextSteps(repoRoot: string, kimiHome: string): void {
	console.log("\n=== Next steps (in the Kimi Code TUI) ===");
	const managed = join(kimiHome, "plugins", "managed");
	if (repoRoot.startsWith(managed)) {
		console.log("The fusengine plugin is already installed (you ran setup from its managed copy).");
		console.log("Just run: /reload   (or start a new session)");
	} else {
		console.log("Install the plugin, then reload:");
		console.log(`  /plugins install ${repoRoot}`);
		console.log("  (or from anywhere: /plugins install https://github.com/fusengine/kimi-code)");
		console.log("Then run /reload (or start a new session) to apply.");
	}
}
