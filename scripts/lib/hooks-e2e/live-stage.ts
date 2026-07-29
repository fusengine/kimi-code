/**
 * live-stage.ts — Layer 3 staging: the REAL @fusengine/harness from npm,
 * installed into a tmp cache dir via the installer's installRuntimeDeps.
 * Cache reuse: a present bin (matching the FUSENGINE_HARNESS_VERSION pin when
 * set) skips the npm fetch entirely. Network failure → warn + false, and the
 * live layer skips instead of failing the suite.
 */
import { join } from "node:path";
import { tmpdir } from "node:os";
import { exists, readJsonSafe } from "../fs-exists";
import { installRuntimeDeps } from "../install/runtime-deps";
import type { InstallContext } from "../../../src/interfaces/index.ts";

const BIN_REL = join("node_modules", "@fusengine", "harness", "dist", "cli", "bin.mjs");

/** Shared cache location so repeated suite runs reuse one npm install. */
export function liveHarnessCache(): string {
	return join(tmpdir(), "fusengine-test-harness");
}

/** Staged version in the cache dir; null when absent. */
async function cachedVersion(cacheDir: string): Promise<string | null> {
	const pkg = await readJsonSafe<{ version?: string }>(
		join(cacheDir, "node_modules", "@fusengine", "harness", "package.json"),
	);
	return pkg?.version ?? null;
}

/** True when the real harness is ready in cacheDir; false = skip the live layer. */
export async function stageLiveHarness(cacheDir: string): Promise<boolean> {
	const bin = join(cacheDir, BIN_REL);
	const pin = process.env.FUSENGINE_HARNESS_VERSION;
	const staged = await cachedVersion(cacheDir);
	if ((await exists(bin)) && (!pin || staged === pin)) {
		console.log(`  live harness: cache hit (v${staged}) → ${cacheDir}`);
		return true;
	}
	// Force the npm path even if the caller's env points at a local copy.
	const saved = process.env.FUSENGINE_HARNESS_SRC;
	delete process.env.FUSENGINE_HARNESS_SRC;
	try {
		const ctx: InstallContext = {
			dryRun: false, skipEnv: false, skipMcp: false, verbose: false,
			kimiHome: cacheDir, repoRoot: cacheDir, pluginsRoot: cacheDir,
		};
		const res = await installRuntimeDeps(ctx);
		if (res.status === "fail") {
			console.warn(`  live harness staging failed (npm) — skipping live layer: ${res.notes.join("; ")}`);
			return false;
		}
		console.log(`  live harness: installed from npm → ${cacheDir}`);
		return true;
	} finally {
		if (saved !== undefined) process.env.FUSENGINE_HARNESS_SRC = saved;
	}
}
