/**
 * summary.ts — Final report: per-step OK/SKIP/FAIL table, then post-install
 * guidance adapted to where the installer ran from (managed copy vs clone).
 * TTY: clack p.note panels. Non-TTY: the original plain output, byte-for-byte.
 */
import { join } from "node:path";
import type { InstallStepResult } from "../../../src/interfaces/index.ts";
import { initUi } from "./ui";

const STATUS_LABEL = { ok: "OK", skip: "SKIP", fail: "FAIL" } as const;

/** One summary row per step, in run order. */
function summaryRows(results: InstallStepResult[]): string[] {
	return results.map((r) => {
		const notes = r.notes.length > 0 ? ` (${r.notes.join("; ")})` : "";
		return `${r.name.padEnd(22)} ${STATUS_LABEL[r.status]}${notes}`;
	});
}

/** Print the per-step outcome table; returns true when every step passed. */
export async function printSummary(results: InstallStepResult[], dryRun: boolean): Promise<boolean> {
	const title = `Install summary${dryRun ? " (DRY-RUN — nothing outside the repo was written)" : ""}`;
	const p = await initUi();
	if (p) p.note(summaryRows(results).join("\n"), title);
	else console.log(`\n=== ${title} ===\n${summaryRows(results).join("\n")}`);
	return results.every((r) => r.status !== "fail");
}

/** Print the post-install guidance, adapted to where the installer ran from. */
export async function printNextSteps(repoRoot: string, kimiHome: string): Promise<void> {
	const lines: string[] = [];
	const managed = join(kimiHome, "plugins", "managed");
	if (repoRoot.startsWith(managed)) {
		lines.push("The fusengine plugin is already installed (you ran setup from its managed copy).");
		lines.push("Just run: /reload   (or start a new session)");
	} else {
		lines.push("Install the plugin, then reload:");
		lines.push(`  /plugins install ${repoRoot}`);
		lines.push("  (or from anywhere: /plugins install https://github.com/fusengine/kimi-code)");
		lines.push("Then run /reload (or start a new session) to apply.");
	}
	const p = await initUi();
	if (p) p.note(lines.join("\n"), "Next steps (in the Kimi Code TUI)");
	else console.log(`\n=== Next steps (in the Kimi Code TUI) ===\n${lines.join("\n")}`);
}
