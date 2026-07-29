/**
 * payload.ts — Synthesize a Kimi hook payload for a rule. Base shape is
 * {hook_event_name, session_id, cwd}; tool events add tool_name/tool_input,
 * UserPromptSubmit a prompt, Subagent* an agent_type, Notification a
 * notification_type. The tool_name is derived from the matcher regex: first
 * literal alternative (Write|Edit → Write), mcp__.*x expanded, empty → Bash.
 */
import type { HookRuleRef, PayloadOverrides } from "../../../src/interfaces/index.ts";

/** Official Kimi hook events (docs + repo AGENTS.md). */
export const KIMI_EVENTS = new Set([
	"UserPromptSubmit", "PreToolUse", "PostToolUse", "PostToolUseFailure",
	"PermissionRequest", "PermissionResult", "SessionStart", "SessionEnd",
	"SubagentStart", "SubagentStop", "Stop", "StopFailure", "Interrupt",
	"PreCompact", "PostCompact", "Notification",
]);

/** Events whose payload carries tool_name + tool_input. */
const TOOL_EVENTS = new Set(["PreToolUse", "PostToolUse", "PostToolUseFailure", "PermissionRequest"]);
const LITERAL_RE = /^[A-Za-z0-9_.-]+$/;

/** First matcher alternative when literal; mcp__.*x → a concrete exa-style tool; "" → Bash. */
export function toolNameForMatcher(matcher: string): string {
	if (!matcher) return "Bash";
	const first = matcher.split("|")[0].trim();
	if (LITERAL_RE.test(first)) return first;
	const mcp = first.match(/^mcp__\.\*(.+)$/);
	if (mcp) return `mcp__${mcp[1]}__web_search_${mcp[1]}`;
	return "Bash"; // no other non-literal case exists in the corpus
}

/** Neutral tool_input: Bash gets `ls`, Write/Edit a tmp path, others empty. */
function toolInputFor(toolName: string): Record<string, unknown> {
	if (toolName === "Bash") return { command: "ls" };
	if (toolName === "Write" || toolName === "Edit") return { file_path: "/tmp/x.ts" };
	return {};
}

/** Build the payload object for one rule; overrides serve the targeted live assertions. */
export function synthesizePayload(
	ref: HookRuleRef,
	overrides: PayloadOverrides = {},
): Record<string, unknown> {
	const { event, matcher } = ref.hook;
	const payload: Record<string, unknown> = {
		hook_event_name: event,
		session_id: "hooks-e2e",
		cwd: "/tmp",
	};
	if (TOOL_EVENTS.has(event)) {
		const toolName = overrides.toolName ?? toolNameForMatcher(matcher);
		payload.tool_name = toolName;
		payload.tool_input = overrides.toolInput ?? toolInputFor(toolName);
	}
	if (event === "UserPromptSubmit") payload.prompt = overrides.prompt ?? "hello from hooks-e2e";
	if (event === "SubagentStart" || event === "SubagentStop") payload.agent_type = "explore-codebase";
	if (event === "Notification") {
		payload.notification_type = matcher ? matcher.replace(/\\(.)/g, "$1") : "task.completed";
	}
	return payload;
}
