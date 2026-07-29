/**
 * harness-version.ts — Which @fusengine/harness version to stage.
 * Priority: $FUSENGINE_HARNESS_VERSION (explicit pin) > the repo's
 * package.json floor (fusengine.harnessMinVersion) > "latest".
 */
import { join } from "node:path";
import { readJsonSafe } from "../fs-exists";

type Pkg = { fusengine?: { harnessMinVersion?: string } };

/** Reads the repo package.json harness floor; null when undeclared. */
export async function harnessFloor(repoRoot: string): Promise<string | null> {
	const pkg = await readJsonSafe<Pkg>(join(repoRoot, "package.json"));
	return pkg?.fusengine?.harnessMinVersion ?? null;
}

/** The version spec passed to `bun add` (e.g. ">=0.1.85" or "latest"). */
export async function harnessSpec(repoRoot: string): Promise<string> {
	if (process.env.FUSENGINE_HARNESS_VERSION) return process.env.FUSENGINE_HARNESS_VERSION;
	const floor = await harnessFloor(repoRoot);
	return floor ? `>=${floor}` : "latest";
}
