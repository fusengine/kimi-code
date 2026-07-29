/**
 * mcp-select.ts — MCP server selection BEFORE key prompting (parity with the
 * Claude installer). TTY: clack multiselect over catalog + .bak servers,
 * initialValues = entries whose `default` is not false, required: false.
 * Non-TTY: the explicit FUSENGINE_MCP_SERVERS="a,b,c" allowlist, else all.
 * The choice lands in ctx.mcpSelection (undefined = all) and is honored by
 * missingKeys and scanMcpServers. Dry-run never prompts: selection stays
 * undefined so the plan lists every server as before.
 */
import type { InstallContext, InstallStepResult, McpServerConfig } from "../../../src/interfaces/index.ts";
import { collectRawServers } from "./mcp-resolve";
import { initUi, plan, warn } from "./ui";

type RawServer = { name: string; cfg: McpServerConfig; origin: string };

/** Dedupe by name, first wins — the same rule the merge applies. */
function dedupe(raw: RawServer[]): RawServer[] {
	const seen = new Set<string>();
	return raw.filter((s) => {
		if (seen.has(s.name)) return false;
		seen.add(s.name);
		return true;
	});
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
		const defaults = all.filter((s) => s.cfg.default !== false).map((s) => s.name);
		const picked = await p.multiselect({
			message: "Select MCP servers to install:",
			options: all.map((s) => ({
				value: s.name,
				label: s.name,
				hint: (s.cfg._description as string) ?? s.origin,
			})),
			initialValues: defaults,
			required: false,
		});
		ctx.mcpSelection = p.isCancel(picked) ? new Set(defaults) : new Set(picked as string[]);
	}
	res.notes.push(ctx.mcpSelection ? `${ctx.mcpSelection.size}/${all.length} selected` : `all ${all.length} selected`);
	return res;
}
