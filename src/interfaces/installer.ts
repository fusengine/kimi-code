/**
 * Installer shapes — install-kimi.ts and scripts/lib/install/* share these.
 * Interfaces live ONLY under src/interfaces/ (repo rule, hook-enforced).
 */

/** CLI flags: dry-run is the default; --yes flips it to false. */
export interface InstallerFlags {
	dryRun: boolean;
	skipEnv: boolean;
	skipMcp: boolean;
	verbose: boolean;
}

/** Resolved execution context handed to every install step. */
export interface InstallContext extends InstallerFlags {
	/** $KIMI_CODE_HOME (default ~/.kimi-code) — the only write target outside the repo. */
	kimiHome: string;
	/** Repo base dir: parent of pluginsRoot (script location by default). */
	repoRoot: string;
	/** plugins/ dir scanned for manifests, mcp.json.bak, agents/, rules. */
	pluginsRoot: string;
}

export type StepStatus = "ok" | "skip" | "fail";

/** Per-step outcome collected by the runner and rendered in the summary. */
export interface InstallStepResult {
	name: string;
	status: StepStatus;
	notes: string[];
}

/** One plugin dir with a valid kimi.plugin.json. */
export interface PluginCatalogEntry {
	/** Directory name under plugins/ (e.g. "ai-pilot"). */
	dir: string;
	/** Manifest name (e.g. "fuse-ai-pilot") — differs from dir in many cases. */
	name: string;
	displayName: string;
}

/** MCP server config as declared in a plugin mcp.json.bak (shape is per-server free-form). */
export type McpServerConfig = Record<string, unknown>;

export interface MarketplaceEntry {
	id: string;
	displayName: string;
	source: string;
}

/** Kimi plugin marketplace file: {"version":"2","plugins":[...]}. */
export interface MarketplaceFile {
	version: string;
	plugins: MarketplaceEntry[];
}

/** Output of a full installer run: per-step results plus the marketplace artifact. */
export interface RunOutcome {
	results: InstallStepResult[];
	marketplace: MarketplaceFile;
	marketplacePath: string;
}
