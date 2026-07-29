/**
 * env-write.ts — Write helpers for $KIMI_HOME/.env (append/upsert KEY=VALUE
 * lines; never touches unrelated entries, never truncates the file).
 */
import { join } from "node:path";
import type { InstallContext } from "../../../src/interfaces/index.ts";

/** Upsert each KEY=value into $KIMI_HOME/.env, replacing same-key lines. */
export async function upsertEnvVars(ctx: InstallContext, vars: Record<string, string>): Promise<void> {
	const path = join(ctx.kimiHome, ".env");
	let lines: string[] = [];
	try {
		lines = (await Bun.file(path).text()).split("\n");
	} catch { /* new file */ }
	for (const [key, value] of Object.entries(vars)) {
		const re = new RegExp(`^${key}=`);
		const idx = lines.findIndex((l) => re.test(l));
		if (idx >= 0) lines[idx] = `${key}=${value}`;
		else lines.push(`${key}=${value}`);
	}
	await Bun.write(path, `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`);
}
