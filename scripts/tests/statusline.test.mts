/** Unit tests for the Kimi statusline (session resolution, wire parsing, render). */
import { describe, expect, test, beforeAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findActiveSession } from "../../plugins/core-guards/statusline/src/session";
import { readWire } from "../../plugins/core-guards/statusline/src/wire";
import { compose, toOscTitle } from "../../plugins/core-guards/statusline/src/render";

const root = mkdtempSync(join(tmpdir(), "sl-test-"));
const sesDir = join(root, "wd_proj_abc", "session_1");
const wirePath = join(sesDir, "agents", "main", "wire.jsonl");

beforeAll(() => {
	mkdirSync(join(sesDir, "agents", "main"), { recursive: true });
	writeFileSync(join(sesDir, "state.json"), JSON.stringify({
		createdAt: "2026-07-29T10:00:00Z",
		updatedAt: "2026-07-29T12:00:00Z",
		workDir: "/tmp/proj",
	}));
	writeFileSync(wirePath, [
		JSON.stringify({ type: "metadata", modelAlias: "kimi-code/k3", thinkingEffort: "high" }),
		JSON.stringify({ type: "llm.request" }),
		JSON.stringify({ type: "usage.record", model: "kimi-code/k3", usage: { inputOther: 100000, output: 500, inputCacheRead: 424576, inputCacheCreation: 0 } }),
		JSON.stringify({ type: "context.append_loop_event", event: { part: { type: "tool_use", name: "Edit" } } }),
		"{not json",
	].join("\n"));
});

describe("kimi-statusline", () => {
	test("finds the latest session and its workDir", () => {
		const s = findActiveSession(root);
		expect(s?.workDir).toBe("/tmp/proj");
		expect(s?.wirePath).toBe(wirePath);
	});

	test("parses model, effort, edits, steps and context %", () => {
		const w = readWire(wirePath);
		expect(w.model).toBe("kimi-code/k3");
		expect(w.thinkingEffort).toBe("high");
		expect(w.edits).toBe(1);
		expect(w.steps).toBe(1);
		expect(w.ctxPercent).toBe(50);
	});

	test("composes a readable line and a valid OSC title", () => {
		const s = findActiveSession(root)!;
		const line = compose({ session: s, wire: readWire(wirePath), git: { branch: "main", dirty: 2 } });
		expect(line).toContain("⎇ main*2");
		expect(line).toContain("kimi-code/k3");
		expect(line).toContain("ctx 50%");
		expect(line).toContain("proj");
		const osc = toOscTitle(line);
		expect(osc.startsWith("\x1b]0;")).toBe(true);
		expect(osc.endsWith("\x07")).toBe(true);
	});
});
