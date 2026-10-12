# Release Workflow — Watch It to the End (Step 9 detail)

Full procedure for `commands/commit.md` **Step 9**. Runs in FULL mode only, after Step 8 pushed `vX.Y.Z` and `git merge-base --is-ancestor vX.Y.Z main` succeeded. A pushed tag may trigger a release workflow (e.g. `Publish` to npm): the release is **not done** at `git push origin vX.Y.Z` — it is done when that workflow is green and the registry serves the version. Never leave a failed run for the owner to discover later.

## 0. Is there a release workflow at all?

Verify, never assume:

```bash
ls .github/workflows/ 2>/dev/null && grep -lE '^[[:space:]]*tags:' .github/workflows/*.y*ml 2>/dev/null
```

No `.github/workflows/` directory, or no workflow with an `on: push: tags` trigger → the result is `publish: none`; nothing is watched and the rest of this file is skipped. A repo without `.github/` (such as this plugin-suite source repo) ends its release at Step 8 with `publish: none`.

## 1. Find the runs the tag triggered

Runs take a few seconds to register; poll (bounded, ~90s) before concluding there are none:

```bash
sha=$(git rev-list -n1 vX.Y.Z)
attempt=0
until [ -n "$(gh run list --commit "$sha" --event push --json databaseId -q '.[].databaseId')" ]; do
  attempt=$((attempt + 1)); [ "$attempt" -ge 18 ] && break; sleep 5
done
gh run list --commit "$sha" --event push --json databaseId,name,status,conclusion
```

A tag workflow exists but no run registered after the poll → `publish: failed:<workflow> no-run` and report it; never call it published.

## 2. Watch every run

The exit code gates — never pipe it:

```bash
gh run watch <id> --exit-status
```

## 3. On failure, read the log at once

```bash
gh run view <id> --log-failed
```

Classify:

- **Flaky** — the failing step is not caused by this release's diff: a timing/perf threshold just over its limit (e.g. `expected < 50ms, got 52.7ms`), a network or registry timeout, a runner crash. → `gh run rerun <id> --failed` (failed jobs only), then back to step 2 on the same `<id>`. At most **2 reruns**; a 3rd failure → escalate (`status: blocked`).
- **Real defect** — a compile/type/lint error, a deterministic test failure, an auth/permission error, or the same failure twice in a row. → stop, never rerun. Report the run URL, the failing job and step, and the log lines that show the cause.

Never change a test or a threshold to make the publish pass — a flaky threshold is reported to the owner, whose decision it is.

## 4. Verify the published artifact

Before announcing anything. For an npm package:

```bash
npm view <package-name> version   # must equal X.Y.Z
```

For another registry, run its matching version query. Every post-publish verification job of the workflow (e.g. `verify bunx serves the published version`) must also be green on the final attempt.

## Status vocabulary

Announce **"published" only when steps 2, 3 and 4 all hold.** Until then the status is `tagged, publish pending` or `publish failed:<job>` — never "released".

| Outcome | `publish:` report line |
|---------|------------------------|
| Green run(s) + registry serves X.Y.Z | `published X.Y.Z (registry ✓, verify job ✓)` |
| Still running / not yet verified | `pending` |
| Flaky failure, rerun in progress | `failed:<job> flaky→rerun <n>/2` |
| Real defect, or 3rd failure | `failed:<job> real-defect` |
| No tag-triggered workflow (verified) | `none` |

The release runs only through the `commit` agent launched by the lead — never through a code delegate or an external executor.
