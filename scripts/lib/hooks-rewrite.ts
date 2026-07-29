/**
 * Claude → Kimi hook event mapping.
 * Kimi supports the full native event set; three Claude-only events collapse
 * onto the closest Kimi equivalent.
 */
export const EVENT_MAP: Record<string, string> = {
	SessionStart: "SessionStart",
	UserPromptSubmit: "UserPromptSubmit",
	PreToolUse: "PreToolUse",
	PostToolUse: "PostToolUse",
	PostToolUseFailure: "PostToolUseFailure",
	SubagentStart: "SubagentStart",
	SubagentStop: "SubagentStop",
	Stop: "Stop",
	SessionEnd: "SessionEnd",
	PermissionRequest: "PermissionRequest",
	PreCompact: "PreCompact",
	PostCompact: "PostCompact",
	Notification: "Notification",
	// Collapses
	InstructionsLoaded: "SessionStart",
	TeammateIdle: "SubagentStop",
	TaskCompleted: "Notification",
};

/** Forced matcher when an event collapses (else the rewritten source matcher). */
export const EVENT_MATCHER_OVERRIDE: Record<string, string> = {
	TaskCompleted: "task\\.completed",
};

/** Per-alternative tool renames applied inside `|` matcher patterns. */
const MATCHER_MAP: Record<string, string> = {
	Task: "Agent",
	WebFetch: "FetchURL",
	MultiEdit: "Edit",
};

export function rewriteMatcher(matcher = ""): string {
	if (!matcher) return "";
	const parts = matcher.split("|").map((part) => MATCHER_MAP[part] ?? part);
	return [...new Set(parts)].join("|");
}
