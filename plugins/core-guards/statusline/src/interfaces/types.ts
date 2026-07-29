/** Shared types for the Kimi statusline daemon. */

/** Active Kimi session, resolved from $KIMI_CODE_HOME/sessions/. */
export interface SessionInfo {
	workDir: string;
	createdAt: number;
	updatedAt: number;
	wirePath: string;
}

/** Metrics extracted from the session's wire.jsonl. */
export interface WireInfo {
	model: string;
	thinkingEffort: string;
	edits: number;
	steps: number;
	ctxPercent: number | null;
}

/** Git state of the session's workDir. */
export interface GitInfo {
	branch: string;
	dirty: number;
}

/** Everything the renderer needs to compose one status line. */
export interface StatusData {
	session: SessionInfo;
	wire: WireInfo;
	git: GitInfo | null;
}
