/**
 * build-remote-marketplace.ts — Generate marketplace.remote.json, the
 * GitHub-hosted variant of the catalog: same 24 plugin ids, but `source`
 * points at the per-plugin zip attached to the GitHub release, so
 * `/plugins marketplace <raw-url>` works without cloning the repo.
 *
 * Usage: bun run scripts/build-remote-marketplace.ts [tag]   (default: latest release tag)
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "fusengine/kimi-code";

/** Resolve the release tag: CLI arg, else the newest GitHub release. */
function resolveTag(): string {
	if (process.argv[2]) return process.argv[2];
	const r = spawnSync("gh", ["release", "view", "--repo", REPO, "--json", "tagName", "-q", ".tagName"], { encoding: "utf8" });
	if (r.status !== 0 || !r.stdout.trim()) throw new Error(`no release found on ${REPO} — pass a tag explicitly`);
	return r.stdout.trim();
}

/** All plugin ids from their manifests, with display names. */
function catalog(): Array<{ id: string; displayName: string }> {
	const out = [];
	for (const dir of readdirSync(join(ROOT, "plugins"))) {
		const mf = join(ROOT, "plugins", dir, "kimi.plugin.json");
		try {
			const m = JSON.parse(readFileSync(mf, "utf8"));
			out.push({ id: m.name, displayName: m.interface?.displayName ?? m.name });
		} catch { /* not a plugin dir */ }
	}
	return out.sort((a, b) => a.id.localeCompare(b.id));
}

const tag = resolveTag();
const plugins = catalog().map(({ id, displayName }) => ({
	id,
	displayName,
	source: `https://github.com/${REPO}/releases/download/${tag}/${id}.zip`,
}));
const file = { version: "2", plugins };
writeFileSync(join(ROOT, "marketplace.remote.json"), `${JSON.stringify(file, null, 2)}\n`);
console.log(`marketplace.remote.json: ${plugins.length} plugins → release ${tag}`);
