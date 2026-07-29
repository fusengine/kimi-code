import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { transformManifest } from "./manifest";
import { transformSkills } from "./skills";
import { transformHooks } from "./hooks";
import { transformAgents } from "./agents";
import { transformCommands } from "./commands";
import { copyPassthrough } from "./passthrough";
import { discoverPlugins } from "./types";
import { logReport } from "./runner-log";
import type {
	ConverterResult,
	MigrationReport,
	PluginReport,
	StepResult,
} from "./types";

function toStep(name: string, r: ConverterResult): StepResult {
	return {
		step: name,
		ok: r.errors.length === 0,
		converted: r.converted,
		errors: r.errors,
		warnings: r.warnings ?? [],
	};
}

async function runStep(
	name: string,
	fn: () => Promise<ConverterResult>,
): Promise<StepResult> {
	try {
		return toStep(name, await fn());
	} catch (err) {
		return { step: name, ok: false, converted: 0, errors: [(err as Error).message] };
	}
}

export async function migratePlugin(
	srcDir: string,
	destDir: string,
): Promise<PluginReport> {
	await mkdir(destDir, { recursive: true });
	const steps: StepResult[] = [
		await runStep("manifest", () => transformManifest(srcDir, destDir)),
		await runStep("skills", () => transformSkills(srcDir, destDir)),
		await runStep("hooks", () => transformHooks(srcDir, destDir)),
		await runStep("agents", () => transformAgents(srcDir, destDir)),
		await runStep("commands", () => transformCommands(srcDir, destDir)),
		await runStep("passthrough", () => copyPassthrough(srcDir, destDir)),
	];
	return {
		plugin: srcDir.split("/").pop() ?? srcDir,
		srcDir,
		destDir,
		ok: steps.every((s) => s.ok),
		steps,
	};
}

export async function migrateAll(
	srcRoot: string,
	destRoot: string,
): Promise<MigrationReport> {
	const startedAt = new Date().toISOString();
	const reports: PluginReport[] = [];
	for (const name of discoverPlugins(srcRoot)) {
		const manifest = Bun.file(join(srcRoot, name, ".claude-plugin", "plugin.json"));
		if (!(await manifest.exists())) {
			console.log(`[SKIP] ${name} (no plugin.json — utility, not a plugin)`);
			continue;
		}
		const report = await migratePlugin(join(srcRoot, name), join(destRoot, name));
		reports.push(report);
		logReport(name, report);
	}
	return {
		startedAt,
		finishedAt: new Date().toISOString(),
		totalPlugins: reports.length,
		successCount: reports.filter((r) => r.ok).length,
		failureCount: reports.filter((r) => !r.ok).length,
		plugins: reports,
	};
}
