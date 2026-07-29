#!/usr/bin/env bun
import { join, resolve } from "node:path";
import { migrateAll, migratePlugin } from "./lib/runner";
import { exists } from "./lib/fs-exists";

const DEFAULT_SRC = resolve(import.meta.dir, "../../claude-plugins/plugins");
const DEFAULT_DEST = resolve(import.meta.dir, "../plugins");

async function main(): Promise<void> {
	const srcRoot = process.argv[2] ?? DEFAULT_SRC;
	const destRoot = process.argv[3] ?? DEFAULT_DEST;
	if (!(await exists(srcRoot))) {
		console.error(`Source not found: ${srcRoot}`);
		process.exit(1);
	}
	const report = await migrateAll(srcRoot, destRoot);
	const reportPath = join(destRoot, "migration-report.json");
	await Bun.write(reportPath, JSON.stringify(report, null, 2));
	console.log(
		`\nDone: ${report.successCount}/${report.totalPlugins} OK. Report: ${reportPath}`,
	);
	if (report.failureCount > 0) process.exit(1);
}

export { migratePlugin, migrateAll };

if (import.meta.main) await main();
