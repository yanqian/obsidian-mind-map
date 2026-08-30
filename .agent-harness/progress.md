# Progress

## Current System Status

Harness 0.3.9 is installed in hidden layout. F044-F048 are complete. The reopened F045 fenced-code defect is fixed, independently evaluated, and accepted through Human Eval. The maintained 2.0.0 fork builds reproducibly and produces a verified local release directory.

## Last Completed Feature

F045 — Restore current-note mind-map preview, including fenced-code notes, on current Obsidian.

## Next Feature

No feature is currently pending.

## Known Issues

- F044 replaced the upstream 2020 build stack and passes root recovery, type checking, project tests, production bundling, and independent evaluation.
- F045 passed independent evaluation on its first attempt; durable evidence is in `.agent-harness/runs/20260825T085311Z-F045-eval.md`.
- Human Eval later reopened F045 because `markmap-lib` resolves Prism's dynamic language loader incorrectly in the production browser bundle, leaving a stale `No Markdown note selected` state for a valid note with an unlabeled fenced code block. The fix disables that obsolete Prism transform while retaining fenced-code content and KaTeX, and adds an honest caught render-error state.
- Regression coverage now exercises both source transforms and an esbuild-produced browser bundle with unlabeled and `bash` fenced blocks. `npm run release:local` passed type checking, 10 tests, production bundling, and packaging.
- The repaired 2.0.0 package was checksum-matched into the work vault. Obsidian 1.13.7 rendered `01-Note/DDIS Note - Chapter 3.md` as a populated mind map including its fenced Bash block; the console contained seven informational messages and no errors. Screenshot evidence is `.agent-harness/runs/F045-fenced-code-fixed-obsidian-1.13.7.jpeg`.
- A repeated `work-fast` entry reused F045's pre-reopen coding evidence and skipped directly to evaluation. Interactive manual fallback is recorded in `.agent-harness/runs/20260825T153745Z-F045-manual-fallback.md`; fresh coding evidence was subsequently reviewed by a separate cold-start Evaluator and passed in `.agent-harness/runs/20260825T154908Z-F045-eval.md`.
- F045 Human Eval is accepted after real-app verification; durable acceptance evidence is in `.agent-harness/runs/20260825T154940Z-F045-human-eval.md`.
- F046 replaces one-second polling with `file-open` and vault `modify` events, scopes SVG cleanup to one view, and persists `{file, pinned}` in view state.
- Real-app F046 verification covered unpinned following, edit refresh, pin protection, unpin resume, and a pinned layout restart; screenshot evidence is in `.agent-harness/runs/F046-pinned-layout-restore.png`.
- F046 passed independent evaluation on its first attempt; durable evidence is in `.agent-harness/runs/20260825T090507Z-F046-eval.md`.
- F047 rewrites multiple internal links idempotently, preserves HTTP(S) links, scopes SVG operations to one view, and reports all screenshot failures through Notice.
- Real-app F047 verification confirmed three internal navigation targets, one preserved external target, a caught tainted-canvas failure, and successful PNG clipboard writing after the data-URL correction. Screenshot evidence is in `.agent-harness/runs/F047-links-and-screenshot.png`.
- F047 passed independent evaluation on its first attempt; durable evidence is in `.agent-harness/runs/20260825T091432Z-F047-eval.md`.
- The installed `obsidian` CLI currently exits 134 even for `help` and `version`; F048 will retain this as a capability observation and use the already-working isolated GUI/Computer Use path for runtime error and DOM evidence.
- `npm run release:local` produces `dist/obsidian-mind-map-2.0.0/` with `manifest.json`, `main.js`, and `SHA256SUMS`; package and manifest versions are aligned and minimum Obsidian is 1.8.9.
- The packaged files were checksum-matched into the ignored test vault. Obsidian DevTools confirmed version 2.0.0, one `.mindmap-svg`, 12 SVG groups, 11 foreignObjects, and no console errors. Evidence screenshots are `.agent-harness/runs/F048-packaged-preview.png` and `.agent-harness/runs/F048-devtools-dom-console.png`.
- F048 passed independent evaluation on its first attempt; durable evidence is in `.agent-harness/runs/20260825T092213Z-F048-eval.md`.
- The revived command is registered in Obsidian 1.12.7 and opens a populated split Markmap view with headings, nested nodes, and a rewritten internal link; screenshot evidence is stored at `.agent-harness/runs/F045-obsidian-1.12.7-preview.png`.
- Official Community Plugins publication or transfer of the original plugin ID is not authorized and remains outside the current minspec.
- The README directs new users to the independent community successor, [Mindmap NextGen](https://github.com/james-tindal/obsidian-mindmap-nextgen), while retaining this repository as a compatibility-recovery fork.
- A local ignored Codex provider contract is configured and its evaluator runtime preflight passed with approved access to Codex state.
- The isolated `test-vault` is ignored by git. A duplicate legacy test plugin folder initially shadowed the rebuilt package; removing its manifest and explicitly enabling `obsidian-mind-map` resolved test-only loading.

## Recovery Notes

- Run `./init.sh` from the project root to verify Harness health.
- Use `make -C .agent-harness work-fast` for the next interactive feature after provider configuration.
