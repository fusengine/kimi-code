/**
 * Migration pipeline shapes — manifests, hooks, step/plugin reports.
 */

export interface KimiHook {
	event: string;
	matcher: string;
	command: string;
	timeout?: number;
}

export interface ManifestAuthor {
	name: string;
	email?: string;
	url?: string;
}

export interface KimiManifest {
	name: string;
	version: string;
	description: string;
	author?: ManifestAuthor | string;
	repository?: string;
	homepage?: string;
	license?: string;
	keywords?: string[];
	skills?: string;
	commands?: string;
	hooks?: KimiHook[];
	interface?: Record<string, unknown>;
}

/** Source `.claude-plugin/plugin.json` shape (all fields optional in practice). */
export interface ClaudeManifest {
	name?: string;
	version?: string;
	description?: string;
	author?: ManifestAuthor | string;
	repository?: string;
	homepage?: string;
	license?: string;
	keywords?: string[];
}

export interface StepResult {
	step: string;
	ok: boolean;
	converted?: number;
	errors: string[];
	warnings?: string[];
}

export interface PluginReport {
	plugin: string;
	srcDir: string;
	destDir: string;
	ok: boolean;
	steps: StepResult[];
}

export interface MigrationReport {
	startedAt: string;
	finishedAt: string;
	totalPlugins: number;
	successCount: number;
	failureCount: number;
	plugins: PluginReport[];
}

export interface ConverterResult {
	converted: number;
	errors: string[];
	warnings?: string[];
}
