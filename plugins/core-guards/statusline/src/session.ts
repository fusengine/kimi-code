/** Finds the most recently active Kimi session under $KIMI_CODE_HOME/sessions/. */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { SessionInfo } from "./interfaces/types";

interface StateFile { updatedAt?: string; createdAt?: string; workDir?: string }

/** Root of Kimi sessions; honors KIMI_CODE_HOME like every other component. */
export function sessionsRoot(): string {
	return join(process.env.KIMI_CODE_HOME || join(homedir(), ".kimi-code"), "sessions");
}

/** Latest session by state.json updatedAt; null when no session exists yet. */
export function findActiveSession(root = sessionsRoot()): SessionInfo | null {
	let best: SessionInfo | null = null;
	for (const wd of safeDirs(root)) {
		for (const ses of safeDirs(join(root, wd))) {
			const statePath = join(root, wd, ses, "state.json");
			const wirePath = join(root, wd, ses, "agents", "main", "wire.jsonl");
			if (!existsSync(statePath) || !existsSync(wirePath)) continue;
			const s = readState(statePath);
			if (!s?.workDir) continue;
			const updated = Date.parse(s.updatedAt ?? s.createdAt ?? "") || 0;
			if (!best || updated > best.updatedAt) {
				best = {
					workDir: s.workDir,
					createdAt: Date.parse(s.createdAt ?? "") || updated,
					updatedAt: updated,
					wirePath,
				};
			}
		}
	}
	return best;
}

function safeDirs(dir: string): string[] {
	try {
		return readdirSync(dir, { withFileTypes: true })
			.filter((e) => e.isDirectory())
			.map((e) => e.name);
	} catch {
		return [];
	}
}

function readState(path: string): StateFile | null {
	try {
		return JSON.parse(readFileSync(path, "utf8")) as StateFile;
	} catch {
		return null;
	}
}
