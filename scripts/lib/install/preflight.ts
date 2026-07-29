/**
 * preflight.ts — Resolve the install context and check the environment.
 * KIMI_HOME comes from $KIMI_CODE_HOME (default ~/.kimi-code); the repo root
 * from the script location. KIMI_PLUGINS_ROOT overrides the plugins dir (used
 * by tests to point at a synthetic repo; repoRoot then becomes its parent).
 */
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { exists } from "../fs-exists";
import type { InstallContext, InstallerFlags } from "../../../src/interfaces/index.ts";
import { info, warn } from "./ui";

/** Parse installer CLI flags. Dry-run is the default; --yes opts into writes. */
export function parseFlags(argv: string[]): InstallerFlags {
	return {
		dryRun: !argv.includes("--yes"),
		skipEnv: argv.includes("--skip-env"),
		skipMcp: argv.includes("--skip-mcp"),
		verbose: argv.includes("--verbose"),
	};
}

/** Build the execution context from the script location + env overrides. */
export function buildContext(scriptDir: string, flags: InstallerFlags): InstallContext {
	const pluginsRoot = process.env.KIMI_PLUGINS_ROOT ?? join(dirname(scriptDir), "plugins");
	return {
		...flags,
		kimiHome: process.env.KIMI_CODE_HOME ?? join(homedir(), ".kimi-code"),
		repoRoot: dirname(pluginsRoot),
		pluginsRoot,
	};
}

/** Verify bun is on PATH (plugin hooks shell out to it) and plugins/ exists. */
export async function preflight(ctx: InstallContext): Promise<void> {
	if (!(await exists(ctx.pluginsRoot))) {
		throw new Error(`plugins dir not found: ${ctx.pluginsRoot}`);
	}
	const bun = Bun.which("bun");
	if (!bun) warn("bun not found on PATH — plugin hooks will fail at runtime");
	info(`KIMI_HOME=${ctx.kimiHome}`);
	info(`repo=${ctx.repoRoot} plugins=${ctx.pluginsRoot}`);
	if (bun) info(`bun=${bun}`);
}
