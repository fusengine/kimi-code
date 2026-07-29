/**
 * install-mcp-select.test.mts — MCP server selection on the non-TTY path.
 * FUSENGINE_MCP_SERVERS is an explicit allowlist: unselected servers are
 * neither installed nor key-prompted, and ones we previously installed are
 * removed by the merge's owned-not-re-added logic on the next run.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeHarness, makeRepo, runInstaller, tmp } from "./install-fixtures.mts";

function fixture() {
	const root = tmp("kimi-mcp-select-");
	const repo = join(root, "repo");
	const harness = join(root, "harness");
	makeRepo(repo);
	makeHarness(harness);
	return { repo, harness, home: join(root, "home") };
}

const servers = (home: string) =>
	JSON.parse(readFileSync(join(home, "mcp.json"), "utf8")).mcpServers as Record<string, unknown>;

describe("install-kimi MCP selection", () => {
	test("FUSENGINE_MCP_SERVERS=fake-stdio installs only it and prompts no key", () => {
		const { repo, harness, home } = fixture();
		const r = runInstaller(home, repo, harness, ["--yes"], {
			FUSENGINE_MCP_SERVERS: "fake-stdio",
			FUSENGINE_FORCE_PROMPT: "1",
		});
		expect(r.code).toBe(0);
		expect(r.out).toContain("1/3 selected");
		expect(r.out).not.toContain("API key(s) required");
		expect(Object.keys(servers(home))).toEqual(["fake-stdio"]);
	});

	test("unselected servers we installed are removed on the next run", () => {
		const { repo, harness, home } = fixture();
		const first = runInstaller(home, repo, harness, ["--yes"], { FAKE_TOKEN: "tok-1" });
		expect(first.code).toBe(0);
		expect(Object.keys(servers(home)).sort()).toEqual(["catalog-stdio", "fake-http", "fake-stdio"]);
		const second = runInstaller(home, repo, harness, ["--yes"], {
			FUSENGINE_MCP_SERVERS: "fake-stdio",
		});
		expect(second.code).toBe(0);
		expect(Object.keys(servers(home))).toEqual(["fake-stdio"]);
	});

	test("unknown names in FUSENGINE_MCP_SERVERS are warned and ignored", () => {
		const { repo, harness, home } = fixture();
		const r = runInstaller(home, repo, harness, ["--yes"], {
			FUSENGINE_MCP_SERVERS: "fake-stdio,nope",
		});
		expect(r.code).toBe(0);
		expect(r.out).toContain("unknown server 'nope'");
		expect(Object.keys(servers(home))).toEqual(["fake-stdio"]);
	});
});
