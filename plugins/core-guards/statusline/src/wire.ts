/** Extracts model, effort, edit count and context usage from wire.jsonl. */
import { readFileSync } from "node:fs";
import type { WireInfo } from "./interfaces/types";

const K3_CONTEXT = 1_048_576;

/** Reads the wire log defensively: any malformed line is skipped. */
export function readWire(wirePath: string): WireInfo {
	const info: WireInfo = { model: "?", thinkingEffort: "", edits: 0, steps: 0, ctxPercent: null };
	let lastInput = 0;
	for (const line of readFileSync(wirePath, "utf8").split("\n")) {
		if (!line) continue;
		let d: Record<string, unknown>;
		try {
			d = JSON.parse(line);
		} catch {
			continue;
		}
		apply(d, info, (n) => { lastInput = n; });
	}
	if (lastInput > 0) info.ctxPercent = Math.min(100, Math.round((lastInput / K3_CONTEXT) * 100));
	return info;
}

/** Fold one wire record into the accumulator. */
function apply(d: Record<string, unknown>, info: WireInfo, setInput: (n: number) => void): void {
	if (typeof d.modelAlias === "string") info.model = d.modelAlias;
	if (typeof d.thinkingEffort === "string") info.thinkingEffort = d.thinkingEffort;
	if (d.type === "llm.request") info.steps++;
	if (d.type === "usage.record") {
		const u = d.usage as Record<string, number> | undefined;
		if (u) setInput((u.inputOther ?? 0) + (u.inputCacheRead ?? 0) + (u.inputCacheCreation ?? 0));
		if (typeof d.model === "string") info.model = d.model;
	}
	if (d.type === "context.append_loop_event") {
		const part = (d.event as Record<string, unknown>)?.part as Record<string, unknown> | undefined;
		const name = (part?.name ?? part?.toolName) as string | undefined;
		if (part?.type === "tool_use" && (name === "Write" || name === "Edit")) info.edits++;
	}
}
