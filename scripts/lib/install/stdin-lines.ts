/**
 * stdin-lines.ts — Shared non-TTY stdin buffer for interactive install steps.
 * Piped stdin closes at EOF and can only be drained once; every prompt step
 * (MCP keys, harness tuning) must share the same buffer and continue where
 * the previous step left off, instead of racing on the stream.
 */

let cache: Promise<string[]> | null = null;
let cursor = 0;

/** Full stdin as lines, drained once and memoized. */
function all(): Promise<string[]> {
	if (!cache) {
		cache = (async () => {
			let data = "";
			for await (const chunk of process.stdin) data += chunk;
			return data.split("\n");
		})();
	}
	return cache;
}

/** Next piped line in order; "" once input is exhausted. */
export async function nextPipedLine(): Promise<string> {
	const lines = await all();
	return lines[cursor++] ?? "";
}
