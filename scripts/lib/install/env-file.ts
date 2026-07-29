/**
 * env-file.ts — Read $KIMI_HOME/.env (KEY=VALUE lines) for ${VAR} resolution.
 * Read-only: the installer never writes secrets. `export ` prefixes and
 * surrounding quotes are tolerated; comments and blank lines are ignored.
 */
import { join } from "node:path";
import type { InstallContext } from "../../../src/interfaces/index.ts";

const ASSIGNMENT_RE = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;

/** Strip one matching pair of surrounding quotes from a raw value. */
function unquote(raw: string): string {
	const v = raw.trim();
	if (v.length >= 2 && v[0] === v.at(-1) && (v[0] === '"' || v[0] === "'")) {
		return v.slice(1, -1);
	}
	return v;
}

/** Load the .env file as a key/value map; empty when missing or --skip-env. */
export async function loadEnvFile(ctx: InstallContext): Promise<Record<string, string>> {
	const env: Record<string, string> = {};
	if (ctx.skipEnv) return env;
	const file = Bun.file(join(ctx.kimiHome, ".env"));
	if (!(await file.exists())) return env;
	for (const line of (await file.text()).split("\n")) {
		const m = line.trim().match(ASSIGNMENT_RE);
		if (m) env[m[1]] = unquote(m[2]);
	}
	return env;
}

/** Resolution environment: process.env overlaid with the .env file (file wins). */
export async function resolutionEnv(ctx: InstallContext): Promise<Record<string, string>> {
	const fromFile = await loadEnvFile(ctx);
	return { ...(process.env as Record<string, string>), ...fromFile };
}
