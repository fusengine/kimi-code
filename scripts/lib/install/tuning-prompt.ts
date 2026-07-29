/**
 * tuning-prompt.ts — Harness tuning knobs, dual-mode. TTY: clack confirm +
 * text(initialValue) per knob. Piped (or clack-less TTY): the original
 * readline/shared-buffer flow with the original question strings — unchanged.
 */
import { createInterface } from "node:readline/promises";
import type { Clack } from "./ui";
import { initUi, warn } from "./ui";
import { nextPipedLine } from "./stdin-lines";

export type Knob = { key: string; label: string; def: string };

export const KNOBS: readonly Knob[] = [
	{ key: "FUSE_SOLID_MAX_LINES", label: "SOLID max lines per file", def: "100" },
	{ key: "FUSE_ENFORCE_TTL_SEC", label: "APEX/SOLID enforcement TTL (sec)", def: "120" },
	{ key: "FUSE_LESSONS_THROTTLE_MIN", label: "Lessons reminder throttle (min)", def: "5" },
	{ key: "FUSE_MCP_TTL_SEC", label: "Cached MCP doc freshness (sec)", def: "172800" },
	{ key: "FUSE_WEBFETCH_TTL_SEC", label: "Web fetch cache freshness (sec)", def: "86400" },
	{ key: "FUSENGINE_CACHE_TTL_MIN", label: "Subagent context cache TTL (min)", def: "30" },
];

/** Clack flow: one confirm, then per-knob text seeded with the current value. */
async function clackKnobs(p: Clack, env: Record<string, string>): Promise<Record<string, string>> {
	const vars: Record<string, string> = {};
	const wants = await p.confirm({ message: "Configure advanced harness tuning?", initialValue: false });
	if (p.isCancel(wants) || !wants) return vars;
	for (const k of KNOBS) {
		const current = env[k.key] ?? k.def;
		const v = await p.text({ message: k.label, initialValue: current });
		if (p.isCancel(v)) {
			warn("tuning cancelled — keeping values accepted so far");
			break;
		}
		const val = String(v).trim() || current;
		if (val !== k.def) vars[k.key] = val;
	}
	return vars;
}

/** Original asker: readline on TTY, shared piped buffer otherwise. */
async function makeAsker(): Promise<(q: string) => Promise<string>> {
	if (!process.stdin.isTTY) return async (q) => (process.stdout.write(q), nextPipedLine());
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return async (q) => rl.question(q);
}

/** Ask for tuning knobs; returns only the values that differ from defaults. */
export async function promptKnobs(env: Record<string, string>): Promise<Record<string, string>> {
	const p = await initUi();
	if (p && process.stdin.isTTY) return clackKnobs(p, env);
	const vars: Record<string, string> = {};
	const ask = await makeAsker();
	const wants = (await ask("Configure advanced harness tuning? [y/N] ")).trim().toLowerCase();
	if (wants !== "y" && wants !== "yes") return vars;
	for (const k of KNOBS) {
		const current = env[k.key] ?? k.def;
		const v = (await ask(`${k.label} [${current}]: `)).trim() || current;
		if (v !== k.def) vars[k.key] = v;
	}
	return vars;
}
