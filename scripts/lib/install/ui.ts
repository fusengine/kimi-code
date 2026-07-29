/**
 * ui.ts — Installer console output. No @clack/prompts here: kimi-code has no
 * runtime dependencies, and the installer is non-interactive (dry-run default).
 */

/** Regular progress line, indented under the current step header. */
export function info(msg: string): void {
	console.log(`  ${msg}`);
}

/** Warning — unresolved placeholders, collisions, preserved user files. */
export function warn(msg: string): void {
	console.warn(`  ⚠ ${msg}`);
}

/** Dry-run planned action — always prefixed so the plan reads as a plan. */
export function plan(msg: string): void {
	console.log(`  WOULD ${msg}`);
}

/** Verbose-only detail line. */
export function detail(enabled: boolean, msg: string): void {
	if (enabled) console.log(`    · ${msg}`);
}
