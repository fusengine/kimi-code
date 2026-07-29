import type { PluginReport } from "./types";

export function logReport(name: string, report: PluginReport): void {
	const hasWarn = report.steps.some((s) => (s.warnings?.length ?? 0) > 0);
	const status = report.ok ? (hasWarn ? "OK*" : "OK") : "FAIL";
	console.log(`[${status}] ${name}`);
	for (const step of report.steps) {
		for (const e of step.errors) console.log(`  ✖ ${step.step}: ${e}`);
		for (const w of step.warnings ?? []) console.log(`  ⚠ ${step.step}: ${w}`);
	}
}
