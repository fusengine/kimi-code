/**
 * ui.ts — Installer console output, dual-mode. TTY: @clack/prompts (lazy
 * dynamic import — never loaded on non-TTY, so test envs without the dep are
 * safe). Non-TTY: the plain console strings the tests depend on — unchanged.
 */

/** Clack module namespace (type-only; the runtime import is dynamic). */
export type Clack = typeof import("@clack/prompts");

let clack: Clack | null | undefined;

/** Load clack once, and only on a TTY; null on non-TTY or import failure. */
export async function initUi(): Promise<Clack | null> {
	if (clack === undefined) {
		clack = process.stdin.isTTY ? await import("@clack/prompts").catch(() => null) : null;
	}
	return clack;
}

/** Regular progress line, indented under the current step header. */
export function info(msg: string): void {
	if (clack) clack.log.info(msg);
	else console.log(`  ${msg}`);
}

/** Warning — unresolved placeholders, collisions, preserved user files. */
export function warn(msg: string): void {
	if (clack) clack.log.warn(msg);
	else console.warn(`  ⚠ ${msg}`);
}

/** Dry-run planned action — always prefixed so the plan reads as a plan. */
export function plan(msg: string): void {
	if (clack) clack.log.step(`WOULD ${msg}`);
	else console.log(`  WOULD ${msg}`);
}

/** Verbose-only detail line. */
export function detail(enabled: boolean, msg: string): void {
	if (!enabled) return;
	if (clack) clack.log.message(`  · ${msg}`);
	else console.log(`    · ${msg}`);
}

/** Step header printed by the runner before each step. */
export function step(name: string): void {
	if (clack) clack.log.step(name);
	else console.log(`▸ ${name}`);
}
