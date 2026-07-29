/** Composes the status line and the terminal-title escape sequence. */
import type { StatusData } from "./interfaces/types";

/** Session age as compact H:MM. */
function age(createdAt: number): string {
	const mins = Math.max(0, Math.round((Date.now() - createdAt) / 60000));
	return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
}

/** `⎇ main*3 · kimi-code/k3 · high · ctx 42% · edits 7 · 2h05 · test` */
export function compose(data: StatusData): string {
	const parts: string[] = [];
	if (data.git) parts.push(`⎇ ${data.git.branch}${data.git.dirty ? `*${data.git.dirty}` : ""}`);
	if (data.wire.model !== "?") parts.push(data.wire.model);
	if (data.wire.thinkingEffort) parts.push(data.wire.thinkingEffort);
	if (data.wire.ctxPercent !== null) parts.push(`ctx ${data.wire.ctxPercent}%`);
	if (data.wire.edits > 0) parts.push(`edits ${data.wire.edits}`);
	parts.push(age(data.session.createdAt));
	parts.push(shortDir(data.session.workDir));
	return parts.join(" · ");
}

/** Basename of the workDir, or the full path for root. */
function shortDir(dir: string): string {
	const name = dir.replace(/\/+$/, "").split("/").pop();
	return name || dir;
}

/** OSC escape setting the terminal window/tab title (iTerm, Terminal, tmux). */
export function toOscTitle(line: string): string {
	return `\x1b]0;${line}\x07`;
}
