/**
 * daemon.ts — kimi-statusline: renders the active Kimi session into the
 * terminal title (OSC) and into $KIMI_CODE_HOME/statusline.txt for tmux/any bar.
 * Commands: start | stop | status (one-shot). Interval: STATUSLINE_MS or 5s.
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import type { StatusData } from "./interfaces/types";
import { findActiveSession } from "./session";
import { readWire } from "./wire";
import { gitInfo } from "./git";
import { compose, toOscTitle } from "./render";

const HOME = process.env.KIMI_CODE_HOME || join(homedir(), ".kimi-code");
const PIDFILE = join(HOME, "statusline.pid");
const OUTFILE = join(HOME, "statusline.txt");

/** Compose the current line once; null when no session exists. */
export function currentLine(): string | null {
	const session = findActiveSession();
	if (!session) return null;
	const data: StatusData = { session, wire: readWire(session.wirePath), git: gitInfo(session.workDir) };
	return compose(data);
}

/** One render pass: terminal title + file. */
function paint(): void {
	const line = currentLine();
	if (!line) return;
	writeFileSync(OUTFILE, `${line}\n`);
	process.stdout.write(toOscTitle(line));
}

/** Detached loop writing pidfile; refuses to start twice. */
function start(): void {
	if (existsSync(PIDFILE) && alive(Number(readFileSync(PIDFILE, "utf8")))) {
		console.log(`already running (pid ${readFileSync(PIDFILE, "utf8")})`);
		return;
	}
	const ms = Number(process.env.STATUSLINE_MS) || 5000;
	const child = spawn(process.execPath, [import.meta.filename!, "__loop", String(ms)], {
		detached: true,
		stdio: "ignore",
	});
	child.unref();
	writeFileSync(PIDFILE, String(child.pid));
	console.log(`kimi-statusline started (pid ${child.pid}, ${ms}ms) → title + ${OUTFILE}`);
}

/** Kill the loop from the pidfile. */
function stop(): void {
	if (!existsSync(PIDFILE)) return console.log("not running");
	const pid = Number(readFileSync(PIDFILE, "utf8"));
	try { process.kill(pid); } catch { /* already dead */ }
	unlinkSync(PIDFILE);
	console.log(`stopped (pid ${pid})`);
}

function alive(pid: number): boolean {
	try { process.kill(pid, 0); return true; } catch { return false; }
}

const cmd = process.argv[2];
if (cmd === "start") start();
else if (cmd === "stop") stop();
else if (cmd === "__loop") {
	paint();
	setInterval(paint, Number(process.argv[3]) || 5000);
} else {
	const line = currentLine();
	if (line) console.log(line);
	else console.log("no active Kimi session");
}
