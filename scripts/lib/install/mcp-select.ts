/**
 * mcp-select.ts — MCP server selection BEFORE key prompting (parity with the
 * Claude installer). TTY: clack multiselect over catalog + .bak servers;
 * initialValues follow the Claude rule — explicit `default` wins, otherwise
 * no-key servers plus key-required ones whose apiKeyEnv is already set —
 * and key-required entries are labelled ✓ / ⚠ key missing. required: false.
 * Non-TTY: the explicit FUSENGINE_MCP_SERVERS="a,b,c" allowlist, else all.
 * The choice lands in ctx.mcpSelection (undefined = all) and is honored by
 * missingKeys and scanMcpServers. Dry-run never prompts: selection stays
 * undefined so the plan lists every server as before.
 */
import type { InstallContext, InstallStepResult, McpServerConfig } from "../../../src/interfaces/index.ts";
import { collectRawServers } from "./mcp-resolve";
import { resolutionEnv } from "./env-file";
import { initUi, plan, warn } from "./ui";

export type RawServer = { name: string; cfg: McpServerConfig; origin: string };

/** Dedupe by name, first wins — the same rule the merge applies. */
function dedupe(raw: RawServer[]): RawServer[] {
	const seen = new Set<string>();
	return raw.filter((s) => {
		if (seen.has(s.name)) return false;
		seen.add(s.name);
		return true;
	});
}

/** True when a server's apiKeyEnv var is set in the resolution environment. */
function keyPresent(cfg: McpServerConfig, env: Record<string, string>): boolean {
	return typeof cfg.apiKeyEnv === "string" && !!env[cfg.apiKeyEnv];
}

/**
 * Preselection, Claude-installer parity: explicit `default` wins; otherwise
 * no-key servers, plus key-required ones whose apiKeyEnv is already set.
 */
export function defaultMcpSelection(all: RawServer[], env: Record<string, string>): string[] {
	return all
		.filter((s) => {
			if (s.cfg.default === true) return true;
			if (s.cfg.default === false) return false;
			return s.cfg.requiresApiKey !== true || keyPresent(s.cfg, env);
		})
		.map((s) => s.name);
}

/** Non-interactive selection: explicit env allowlist, else undefined (= all). */
function envSelection(all: RawServer[]): Set<string> | undefined {
	const raw = process.env.FUSENGINE_MCP_SERVERS;
	if (raw === undefined) return undefined;
	const known = new Set(all.map((s) => s.name));
	const picked = new Set<string>();
	for (const name of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
		if (known.has(name)) picked.add(name);
		else warn(`FUSENGINE_MCP_SERVERS: unknown server '${name}' — ignored`);
	}
	return picked;
}

/** Interactive selection step; stores the result on ctx.mcpSelection. */
export async function selectMcpServers(ctx: InstallContext): Promise<InstallStepResult> {
	const res: InstallStepResult = { name: "selectMcpServers", status: "ok", notes: [] };
	if (ctx.skipMcp) {
		res.status = "skip";
		res.notes.push("--skip-mcp");
		return res;
	}
	const all = dedupe(await collectRawServers(ctx));
	if (all.length === 0) {
		res.status = "skip";
		res.notes.push("no MCP servers declared");
		return res;
	}
	if (ctx.dryRun) {
		plan(`select MCP servers (${all.length} declared)`);
		res.notes.push(`${all.length} declared`);
		return res;
	}
	const p = await initUi();
	if (!p) {
		ctx.mcpSelection = envSelection(all);
	} else {
		const env = await resolutionEnv(ctx);
		const defaults = defaultMcpSelection(all, env);
		const picked = await p.multiselect({
			message: "Select MCP servers to install:",
			options: all.map((s) => {
				const needsKey = s.cfg.requiresApiKey === true;
				const status = needsKey ? ` [${keyPresent(s.cfg, env) ? "✓" : "⚠ key missing"}]` : "";
				return {
					value: s.name,
					label: `${s.name}${status}`,
					hint: (s.cfg._description as string) ?? s.origin,
				};
			}),
			initialValues: defaults,
			required: false,
		});
		ctx.mcpSelection = p.isCancel(picked) ? new Set(defaults) : new Set(picked as string[]);
	}
	res.notes.push(ctx.mcpSelection ? `${ctx.mcpSelection.size}/${all.length} selected` : `all ${all.length} selected`);
	return res;
}
