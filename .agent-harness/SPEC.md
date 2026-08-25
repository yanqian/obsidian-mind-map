# AI Agent Harness Template SPEC

## 1. Goal

Provide a minimal, copyable repository harness for controlled AI-assisted development with Codex, Claude Code, Cursor Agent, or similar coding agents.

The harness makes project state recoverable by storing requirements, feature state, progress, prompts, and validation scripts in files.

## 2. Scope

### Included

- Durable project instructions in `AGENTS.md`.
- Durable repository knowledge in `docs/`.
- Real-world usage notes that link the harness to projects it was extracted from.
- Evaluator quality criteria in `QUALITY.md`.
- Per-run evidence and handoff records in `runs/`.
- Failure-domain classification and harness improvement checks.
- Capability-gap handling rules that prevent agents from hiding missing tools, permissions, generators, dependencies, or environment setup behind local-only workarounds.
- Example-boundary rules that prevent agents from implementing project-level requirements inside default template examples.
- Proven agent guardrails for state safety, external behavior verification, and anti-patterns in `AGENTS.md`.
- Human-readable requirements in `SPEC.md`.
- Machine-readable feature state in `feature_list.json`.
- Human-readable recovery state in `progress.md`.
- A JSON Schema for feature state.
- Prompt templates for planning, work, continuation, and evaluation.
- Deterministic validation scripts.
- A clean-state command for resetting template project state after copying.
- A `Makefile` with common local and CI verification targets.
- A GitHub Actions workflow that runs harness verification on push and pull request.
- Public-facing README positioning for resumable AI coding projects.
- A new-project flow guide with a visual diagram that shows what the skill does and what humans must provide.
- OSS readiness files for licensing, contribution, security reporting, changelog, and issue triage.
- A distributable AI Agent Harness skill that can initialize projects, guide planning, implementation, evaluation, and commit approved work while preserving the repository protocol as the source of durable state.
- A test plan and dependency-free unit, contract, and smoke tests.
- Contract tests for AI agent obligations and harness boundaries.
- A vendor-neutral lightweight `orchestrator.py`.
- Orchestrator-first work entrypoint guidance so implementation and evaluation normally run through the orchestrator instead of ad hoc manual state edits.
- Configurable orchestrator agent provider selection for Codex, Claude Code, Cursor Agent, or another explicitly configured tool.
- A tiny runnable example proving the harness loop works.
- A dependency-free Go server example for service-style projects.

### Excluded

- Hard-coded vendor-specific automation that assumes one installed CLI for every user.
- Cloud deployment.
- CI provider configuration.
- Automatic commits.
- Implicit agent-provider guessing when multiple provider CLIs are available.

## 3. Core Concepts

### Spec First

New work is first written into `SPEC.md` so agents share a stable requirement source.

### Repository Knowledge Map

`AGENTS.md` acts as an entry point. Durable knowledge belongs in `docs/`, quality criteria belong in `QUALITY.md`, and run evidence belongs in `runs/`.

### Failure Improvement Loop

Failures are classified by domain and assessed for harness improvement. Failed or blocked run records must state the failure domain and whether the harness should be improved through docs, prompts, scripts, schemas, tests, or a follow-up feature.

The orchestrator writes a failed run record when unattended coding or evaluation fails. Unknown failure-domain fields intentionally fail validation until the failure is classified and the harness improvement assessment is recorded.

### Capability Gaps

When a required capability is missing, agents must make that gap explicit and durable instead of bypassing it. Required capabilities include tools, permissions, generators, dependencies, services, credentials, runtime settings, CI resources, and verification fixtures needed to implement or verify a feature.

Agents must verify the missing capability with real evidence, then either add a durable project capability such as setup documentation, scripts, adapters, fixtures, CI configuration, or tests; mark the feature blocked; or append a follow-up feature. Temporary workarounds are acceptable only when recorded as temporary and cannot justify marking a feature complete unless the missing capability is provided or explicitly scoped out.

### Example Boundaries

The default `examples/` tree is a harness demonstration surface, not the default place to implement project requirements. Examples may prove that verification works, show adaptation patterns, or be intentionally removed or replaced during fresh project setup.

Agents must not satisfy a project-level feature by modifying `examples/tiny-cli`, `examples/go-server`, or another default example unless the selected feature explicitly targets that example. New product requirements belong in project-owned source, contract, documentation, and test paths with `./init.sh` updated to verify them.

### Feature Tracked

Every executable unit of work is represented in `feature_list.json` with explicit state and acceptance criteria.

Feature count is determined by independently verifiable behavior and capability boundaries, not by how much text the user wrote. Planning must split broad requirements into multiple features when there are separate user-visible behaviors, required capabilities, implementation boundaries, risk domains, or verification surfaces. If a broad requirement stays as one feature, the planning output must explain why the work remains coherent and independently evaluable.

### Evaluator Gated

A feature is complete only when validation passes and an evaluator can justify the result against the acceptance criteria.

Completed features must have durable evaluator evidence. From the evaluator-evidence baseline onward, `status=done` and `passes=true` are valid only when a run record contains `EVAL_PASS: Fxxx` for that feature. This prevents verification commands alone from being mistaken for evaluator-gated completion.

### Orchestrated When Needed

`orchestrator.py` can preview or run the coding/evaluation loop for one unfinished feature at a time. It is intentionally vendor-neutral: `--dry-run` prints prompts, while `scripts/run-coding-agent.sh` and `scripts/run-evaluator-agent.sh` are the explicit role adapters downstream projects replace to connect Codex, Claude Code, Cursor Agent, or another tool.

### Orchestrator-First Work

Goal: make the orchestrator the default work entrypoint for implementing and evaluating one feature, so feature state transitions, attempts, evaluator gating, failure records, and run evidence are owned by one durable flow.

Included scope: update agent rules, skill workflows, README guidance, Makefile or script entrypoints, and contract tests so the normal "work one feature" path starts with the orchestrator. Manual Coding Agent work remains available only as an explicit fallback when adapters are not configured, unavailable, or the user asks for interactive/manual work.

Excluded scope: replacing the orchestrator with a vendor-specific runner, weakening evaluator evidence, automatically committing orchestrated work, or requiring unattended execution when no provider is configured.

Core flows: a user asks to work on the next feature; the documented default command runs one orchestrator round; the orchestrator selects one unfinished feature, invokes Coding Agent and Evaluator Agent adapters, and marks the feature done only after `EVAL_PASS: Fxxx`; if adapters are unavailable, the flow fails closed with clear recovery guidance instead of silently falling back to manual state edits.

Constraints: the startup protocol must still run before work, one feature is handled per round, evaluator evidence remains mandatory for done features after the baseline, manual fallback must be recorded as fallback rather than the default path, and project verification still ends with `./init.sh`.

Ambiguities or assumptions: "default" means default documented entrypoint and convenience target, not that every agent surface must be able to run unattended without adapter configuration.

Required capabilities: deterministic orchestrator command, role adapters, clear adapter-unavailable errors, docs and prompts that route work through the orchestrator first, and tests that lock the default path.

Implementation paths: `AGENTS.md`, `README.md`, `Makefile`, `docs/agent-workflow.md`, `skills/ai-agent-harness/`, bundled template files, `prompts/`, and contract tests.

Verification surface: `./init.sh`, contract tests for orchestrator-first language and targets, orchestrator dry-run checks, and feature validation for the new feature.

### Work-Fast Evaluator-Gated Mode

Goal: add an A/B-testable fast work entrypoint that avoids an extra Coding Agent child process while preserving mandatory cold-start Evaluator Agent isolation and evaluator-gated completion.

Included scope: add a `make work-fast` entrypoint and orchestrator mode that selects one unfinished feature, marks it `in_progress`, increments attempts, emits a Coding Agent prompt or handoff for the current configured provider surface to execute without spawning the Coding Agent role adapter, requires coding evidence from that implementation phase, then always runs the Evaluator Agent adapter in a separate child process before any feature can be marked done. The mode must remain provider-neutral: Codex, Claude Code, Cursor Agent, or a custom provider may perform the coding phase when that provider is the selected implementation surface.

Excluded scope: weakening evaluator evidence, making evaluator child execution optional, allowing the coding phase to write `EVAL_PASS`, automatically committing work, replacing the existing two-child-process `make work` flow, or using chat history as durable state.

Core flows: a user runs `make work-fast`; the harness performs the startup protocol, selects one unfinished feature, marks it in progress, increments attempts, and prints or records the selected feature plus coding instructions for provider-native implementation; the coding phase updates project files and writes coding evidence but does not mark the feature done; the harness resumes the fast flow and runs the Evaluator Agent child process cold against repository state, git diff, acceptance criteria, and `QUALITY.md`; only a matching `EVAL_PASS: Fxxx` allows the harness to set `passes=true` and `status=done`; evaluator failure leaves durable failure evidence and a non-done feature state.

Constraints: `make work` remains the baseline two-child-process orchestrator flow for unattended/batch comparison; `make work-fast` must not silently skip evaluator execution; the Evaluator Agent must reconstruct context from repository files and git history; coding evidence cannot substitute for evaluator evidence; state transitions must preserve one-feature-per-round, attempts, failure records, and final `./init.sh` verification.

Ambiguities or assumptions: the fast mode is intended for interactive/provider-native coding where the current agent surface can perform implementation more quickly than a nested Coding Agent process. If no coding evidence exists when the fast flow reaches evaluation, the feature must not be marked done merely because local tests pass.

Required capabilities: a deterministic `work-fast` make target, orchestrator CLI support for the fast mode or equivalent scripts, durable coding-evidence requirements, mandatory evaluator child adapter invocation, clear documentation that `work-fast` is an A/B alternative to `work`, and tests that prove evaluator gating remains mandatory.

Implementation paths: `Makefile`, `orchestrator.py`, `AGENTS.md`, `README.md`, `docs/agent-workflow.md`, `prompts/`, `skills/ai-agent-harness/`, bundled template files, unit tests, contract tests, `feature_list.json`, `progress.md`, and `runs/`.

Verification surface: `./init.sh`, `make work-fast --dry-run` or the documented dry-run equivalent, unit tests for orchestrator fast-mode state and evaluator requirements, contract tests for documentation and prompt guardrails, and `scripts/validate-feature.sh F036`.

### Interactive Work-Fast Default Guidance

Goal: make repository instructions tell agents that interactive user-led development should default to the evaluator-gated `work-fast` flow, so humans can ask for AI Agent Harness work without re-explaining the mode every time.

Included scope: add a clear preferred-work-mode section to root `AGENTS.md` and generated hidden-layout template `AGENTS.md`; document that interactive development should use `make work-fast` in visible layout and `make -C .agent-harness work-fast` in hidden layout; preserve baseline `make work` for explicit full two-child-process, unattended, or batch work; and add contract coverage so the guidance remains present in both root and bundled template instructions.

Excluded scope: changing orchestrator behavior, adding automatic mode selection, removing `make work`, changing provider configuration, or weakening evaluator evidence.

Core flows: a user asks an agent to use the harness for an interactive requirement; the agent reads `AGENTS.md`, sees the preferred work mode, runs or follows the `work-fast` handoff, implements in the current provider-native session, records fast coding evidence, then reruns `work-fast` so a separate Evaluator Agent child process can accept or reject the feature.

Constraints: coding evidence must still not contain `EVAL_PASS: Fxxx`, must not mark the feature done, and must not substitute for evaluator evidence. Hidden-layout project roots must use `make -C .agent-harness work-fast`; visible-layout template maintenance uses `make work-fast`.

Ambiguities or assumptions: "default" means the recommended interactive workflow in repository instructions; users can still explicitly ask for baseline `make work`.

Required capabilities: durable AGENTS guidance in root and bundled hidden-layout template files, and contract tests that verify the default/preferred wording and command distinction.

Implementation paths: `AGENTS.md`, `skills/ai-agent-harness/assets/template/AGENTS.md`, `test/contract/test_repository_contract.py`, `SPEC.md`, `feature_list.json`, `progress.md`, and `runs/`.

Verification surface: `./init.sh`, contract tests, `make work-fast --dry-run` or equivalent, and `scripts/validate-feature.sh F037`.

### Hidden Layout Work Directory

Goal: prevent agents from treating `make work` as missing in installed projects that use the default hidden layout, where the harness Makefile lives under `.agent-harness/` instead of the project root.

Included scope: document the harness work directory resolution rule in root hidden-layout `AGENTS.md`, full harness rules, workflow docs, prompts, README guidance, skill workflow references, and bundled template files. The visible template keeps `make work` as the local command, while hidden-layout installs must direct agents to run `make -C .agent-harness work` or `cd .agent-harness && make work`.

Excluded scope: generating or overwriting a root project `Makefile`, changing provider configuration semantics, changing project-owned source locations, or making manual fallback acceptable merely because the agent started in the project root.

Core flows: an agent starts in a hidden-layout project root; it reads root `AGENTS.md`, sees that `.agent-harness/Makefile` is the harness work target, and runs `make -C .agent-harness work`; an agent starts inside the harness body and runs `make work`; if provider adapters are unconfigured, the existing fail-closed provider guidance still applies.

Constraints: root project files remain project-owned in hidden layout; harness implementation work still belongs under `.agent-harness/` only when the selected feature changes the harness; project feature implementation belongs in project-owned source and test paths; root `./init.sh` remains the project recovery entry point.

Ambiguities or assumptions: hidden-layout user projects may or may not have their own root `Makefile`; therefore the harness must not depend on or overwrite a root `Makefile` for agent orchestration.

Required capabilities: clear directory-sensitive command guidance, generated hidden-layout root instructions, synchronized bundled skill template files, and contract tests that lock the hidden-layout command.

Implementation paths: `AGENTS.md`, `README.md`, `docs/agent-workflow.md`, prompts, `skills/ai-agent-harness/`, bundled template files, `feature_list.json`, `progress.md`, and contract tests.

Verification surface: `python3 -m unittest discover -s test/contract -p 'test_*.py'`, `./init.sh`, and `scripts/validate-feature.sh F035`.

### Agent Provider Configuration

Goal: let downstream projects explicitly configure which agent provider the orchestrator adapters use, so Codex users can use Codex, Claude Code users can use Claude Code, Cursor users can use Cursor Agent, and no provider is chosen by unsafe guessing.

Included scope: define a durable provider configuration format, adapter behavior, provider validation, documentation, and tests for Codex, Claude Code, Cursor Agent, and custom providers. Configuration may support detection or recommendations, but execution must use an explicit configured provider.

Excluded scope: inventing unverified external CLI schemas, requiring every provider CLI to be installed on all machines, parsing assistant prose as structured output, or auto-selecting one provider when multiple candidates exist.

Core flows: a user configures a provider; the Coding Agent and Evaluator Agent adapters read the provider config; each adapter validates that the configured command is available and suitable; the orchestrator sends the role prompt on stdin; adapter failure exits non-zero with a capability-gap message; unconfigured provider state fails closed with setup guidance.

Constraints: external CLI flags, stdin behavior, output format, and exit-code semantics must be verified from real help output, official documentation, or captured logs before being trusted. Provider-specific parsing must use real-shaped fixtures, and unknown provider schemas must fail closed.

Ambiguities or assumptions: exact Claude Code and Cursor Agent command shapes are provider-specific external behavior and must be verified during implementation before being documented as executable defaults.

Required capabilities: provider config file or environment contract, adapter dispatch logic, provider validation command, setup documentation, failure messages, and regression tests for configured, unconfigured, missing-command, and ambiguous-provider cases.

Implementation paths: `scripts/run-coding-agent.sh`, `scripts/run-evaluator-agent.sh`, provider config docs or templates, `README.md`, `SPEC.md`, `docs/capability-gaps.md`, `docs/external-behavior.md`, `skills/ai-agent-harness/`, bundled template files, and tests.

Verification surface: `./init.sh`, unit or contract tests for provider configuration semantics, adapter failure-mode tests, and captured evidence or documented uncertainty for each trusted provider command shape.

### Final Role Verdict Normalization

Goal: make orchestrated role execution resistant to contradictory provider output where an agent echoes historical run evidence before returning a final verdict, or where a provider exits non-zero after producing a structured final pass verdict.

Included scope: parse Evaluator Agent output by the last matching `EVAL_PASS: Fxxx` or `EVAL_FAIL: Fxxx: <reason>` line for the selected feature; add optional Coding Agent structured verdict lines, `CODING_PASS: Fxxx` and `CODING_FAIL: Fxxx: <reason>`; allow the orchestrator to continue from a non-zero provider process exit only when the corresponding final structured role verdict is a pass for the selected feature; document provider responsibilities for preserving final role verdict lines; and keep the bundled skill template synchronized.

Excluded scope: inferring success from free-form assistant prose, old run records, source diffs, or test log tails; changing provider-specific CLI commands; guessing undocumented Codex, Claude Code, Cursor Agent, or custom provider schemas; automatically marking product features done without evaluator evidence; or implementing concurrent orchestration.

Core flows: an Evaluator Agent reads prior run records that include an old `EVAL_FAIL: Fxxx`, then emits a final `EVAL_PASS: Fxxx`, and the orchestrator accepts the final pass; an Evaluator Agent emits a final `EVAL_FAIL: Fxxx: <reason>` after earlier pass evidence, and the orchestrator rejects the feature; a Coding Agent emits `CODING_PASS: Fxxx` after intermediate failure output and the provider exits non-zero, and the orchestrator logs the contradiction and proceeds to evaluation; a provider exits non-zero without a matching structured pass verdict, and the orchestrator fails closed.

Constraints: verdict matching must be scoped to the selected feature ID; the orchestrator must not infer verdicts from assistant summaries or run-record prose; existing providers that return zero without `CODING_PASS` remain compatible; downstream hidden-layout installs must be able to receive the same file-level fix from the skill template.

Ambiguities or assumptions: some provider CLIs may return non-zero because an intermediate tool command failed even when the final agent message is successful; structured final verdicts are the durable boundary for normalization. Provider-specific task-complete event schemas are intentionally not parsed until verified and modeled as fixtures.

Required capabilities: unit tests that import orchestrator helpers directly and exercise real-shaped role output strings, documentation updates for provider wrapper behavior and final verdict preservation, and skill-template synchronization for `orchestrator.py`, `prompts/work.md`, provider docs, and unit tests.

Implementation paths: `orchestrator.py`, `prompts/work.md`, `docs/agent-provider-configuration.md`, `test/unit/test_scripts.py`, `skills/ai-agent-harness/assets/template/`, `feature_list.json`, `progress.md`, and `runs/`.

Verification surface: `python3 -m unittest discover -s test/unit -p 'test_*.py'`, `./init.sh`, and `scripts/validate-feature.sh F033`.

### Provider Runtime Preflight

Goal: verify that the configured Coding Agent or Evaluator Agent provider can actually start and access its required runtime resources before the orchestrator mutates feature state.

Included scope: add optional provider-agnostic `runtime_check_command`, `coding_runtime_check_command`, and `evaluator_runtime_check_command` configuration fields; run the selected runtime check during adapter preflight; classify permission failures with a machine-readable `PROVIDER_RUNTIME_PERMISSION_REQUIRED` marker; document that the outer agent or user must explicitly approve escalated provider runtime execution; and keep Codex, Claude Code, Cursor Agent, and custom provider configuration entry points available without guessing unverified commands.

Excluded scope: automatically escalating permissions, silently granting access to user-level provider state, parsing private provider task-complete schemas, or requiring Claude Code and Cursor Agent users to adopt Codex command shapes.

Core flows: a configured provider has no runtime check and existing command validation behaves as before; a configured runtime check passes and the orchestrator may mark one feature `in_progress`; a runtime check fails with `Operation not permitted`, state-file, or app-server permission output and the adapter exits before feature attempts are incremented; an outer agent sees `PROVIDER_RUNTIME_PERMISSION_REQUIRED` and asks the user to approve escalated provider runtime execution before retrying.

Constraints: runtime checks run without a shell, just like provider commands; selected provider commands must remain explicit string arrays; failed runtime checks must not be confused with business-code failure or evaluator rejection; provider-specific runtime behavior must be verified before being documented as executable defaults.

Ambiguities or assumptions: Codex documents `--ephemeral` and `$CODEX_HOME` behavior, but deeper state database and app-server schemas remain private and should not be parsed. Claude Code and Cursor Agent runtime checks are configuration entry points until their local CLI behavior is verified.

Required capabilities: adapter runtime-check dispatch, permission-error classification, regression tests for pass and permission-required paths, provider docs and example configuration, and bundled skill template synchronization.

Implementation paths: `scripts/run-agent-provider.py`, `agent-provider.example.json`, `docs/agent-provider-configuration.md`, `test/unit/test_scripts.py`, `skills/ai-agent-harness/assets/template/`, `feature_list.json`, `progress.md`, and `runs/`.

Verification surface: `python3 -m unittest discover -s test/unit -p 'test_*.py'`, `./init.sh`, and `scripts/validate-feature.sh F034`.

### Recoverable

Any session can resume by reading repository files and git history. Chat history is not required.

### Verified External Assumptions

When implementation relies on behavior outside repository code, agents verify that behavior through primary sources, real commands, official documentation, captured logs, or real-shaped fixtures before depending on it.

### Skill Assisted Workflow

The harness can also be used through a distributable skill. The skill is a convenience layer for humans and agents: it initializes or repairs harness files, routes new requirements through planning, routes implementation through one-feature Coding Agent work, routes verification through Evaluator Agent rules, and commits approved work only after explicit user satisfaction.

The skill must not become a hidden state store. `AGENTS.md`, `SPEC.md`, `feature_list.json`, `progress.md`, `docs/`, `QUALITY.md`, `runs/`, and git history remain the durable sources of truth.

### New Project Flow

New users need a single visual map for the first project run. The durable flow guide must show the path from skill invocation, harness initialization, minspec input, SPEC normalization, feature decomposition, runnable skeleton, provider configuration, `make work`, evaluator pass, `./init.sh`, and approved commit.

The flow guide must distinguish what the skill does from what the human must provide. Required human inputs include project location or install mode, minspec content, clarification for ambiguous requirements, provider choice, approval to run real agent work, and explicit approval before commit.

The guide must link to the detailed recovery, spec normalization, feature decomposition, provider configuration, evaluator evidence, and commit rules instead of duplicating the whole manual.

### Project Recovery Init

Installed user projects need a clear distinction between harness verification and project recovery. `.agent-harness/scripts/init.sh` verifies that the harness itself is installed, semantically valid, and runnable. The root `./init.sh` is the project recovery entry point.

Immediately after harness initialization, before a project minspec exists, root `./init.sh` may verify only the harness and must not claim that business code, services, dependencies, or smoke tests exist. Once a minspec is accepted, Planning Agent work must create a runnable-skeleton feature that turns root `./init.sh` into the project recovery contract: install dependencies, start required services, run at least one real smoke test for an endpoint or core function, emit clear logs, and fail with a non-zero exit code when recovery or verification fails.

Project recovery requirements belong in project-owned source, test, contract, and setup paths. Default harness examples can illustrate patterns but cannot satisfy project recovery for downstream projects.

### Spec Normalization

Planning Agent work must normalize vague user input into a concrete SPEC addition before appending feature entries. The normalized requirement must state the goal, included scope, excluded scope, core flows, constraints, ambiguities or assumptions, required capabilities, project-owned implementation paths, and verification surface.

The planner must not convert unclear phrases into executable features by guessing. If the requirement lacks enough detail to define core flows, constraints, or verification, the planner must ask for clarification, record explicit assumptions, mark the ambiguity as a planning risk, or create a capability, blocker, or follow-up feature instead of hiding the gap.

### Feature-Linked Commits

Approved feature commits must include their feature ID first in the commit subject using the format `Fxxx <Action> <concise summary>`. Batch commits may include multiple feature IDs only after explicit user approval. Non-feature commits must use a `No-feature:` subject so later analysis can distinguish repository maintenance from feature work.

The skill must also preserve the template's vendor-neutral boundary. Codex can load the skill through `SKILL.md`, but the bundled scripts, references, and workflow rules should remain usable by other agent tools.

Skill initialization, repair, and upgrade must be tested against realistic project states. Tests should cover `new`, `adopt`, `repair`, `upgrade`, and `check` modes; default non-overwrite behavior for existing project files; repair completeness for missing harness files; upgrade behavior for installed template-version drift; complete diagnostic output from `check`; and version drift handling through template and installation manifests. A newly initialized project is considered a harness only when it can run the verification entry point and its state, scripts, prompts, docs, run templates, and workflow invariants are semantically valid, not merely when files exist.

Skill initialization supports installation layouts. The default `hidden` layout keeps root `AGENTS.md` and `init.sh` as thin entry points and stores harness state, prompts, docs, scripts, tests, runs, schemas, and examples under `.agent-harness/`. The `visible` layout keeps the current template-maintenance shape with harness files at the repository root. `check`, `repair`, and `upgrade` must preserve or infer the installed layout from `.agent-harness/manifest.json`.

### Installed Harness Upgrade Workflow

Goal: make updates to the AI Agent Harness skill/template safely propagatable into already installed projects, so downstream repositories do not see documentation for new commands such as `work-fast` while their project-local `.agent-harness` still lacks the implementation.

Scope included: add an explicit installed-harness upgrade workflow to the skill initializer; make `check` distinguish clean installs, repairable missing files, version drift, merge-sensitive conflicts, and project-owned state changes; add an `upgrade` mode that updates harness-owned static files and versioned template metadata while preserving project-owned state and merge-sensitive project recovery files unless explicitly forced; document the required sequence after updating the skill; and reduce newly installed hidden-layout vendoring by excluding nested `skills/ai-agent-harness/assets/template/` content from installed projects.

Scope excluded: removing the project-local `.agent-harness` runtime entirely, making projects depend only on a global skill at execution time, automatically overwriting root `init.sh` after a minspec has created a project recovery contract, changing provider execution semantics, or migrating historical installed repositories without an explicit operator command.

Core flows: an operator updates the global skill, runs `init_harness.py --mode check --root <project>`, sees that the installed template version is older, runs `--mode upgrade`, and receives updated harness-owned files plus a refreshed manifest; root `init.sh`, project `SPEC.md`, `feature_list.json`, `progress.md`, and `runs/` are preserved; merge-sensitive conflicts are reported and left for manual review unless `--force` is explicitly supplied; a hidden-layout project upgraded from an older version gains `make -C .agent-harness work-fast` without needing manual file copying; a new hidden-layout install does not vendor a second full copy of the template under `.agent-harness/skills/ai-agent-harness/assets/template/`.

Constraints: installed projects must remain reproducible and runnable without relying solely on an ambient global skill, so the project keeps a minimal local harness runtime; upgrade must not silently rewrite project-owned state; check output must remain machine-readable enough for agents to decide whether to ask for approval, run repair, run upgrade, or stop for merge review; tests must cover old-version upgrade behavior using temporary projects, not the developer's live repositories.

Ambiguities or assumptions: the first implementation keeps a minimal vendored skill entry point in installed projects for local documentation and repair fallback, but excludes nested template assets to reduce drift. More aggressive de-vendoring can be planned later if the project adds a stable global-skill runtime contract.

Required capabilities: initializer upgrade mode, installation manifest refresh, copy-filter tests proving nested template assets are excluded from hidden-layout installs, docs and workflow guidance for update-then-upgrade, contract tests for check/upgrade messaging, and regression tests proving project-owned state plus root recovery init are preserved.

Implementation paths: `skills/ai-agent-harness/scripts/init_harness.py`, bundled template initializer, `SKILL.md`, workflow references, README or docs, `test/harness/test_skill_initializer.py`, `test/contract/test_repository_contract.py`, bundled template sync under `skills/ai-agent-harness/assets/template/`, `feature_list.json`, `progress.md`, and `runs/`.

Verification surface: `python3 -m unittest discover -s test/harness -p 'test_*.py'`, `python3 -m unittest discover -s test/contract -p 'test_*.py'`, `./init.sh`, and `scripts/validate-feature.sh F038`.

Skill documentation must distinguish installed skill usage from manual script usage. Users should understand that installing the skill places `skills/ai-agent-harness/` under their skill directory, requires restarting the agent surface when applicable, and allows prompts such as `Use $ai-agent-harness to initialize this project.` Manual `python3 skills/.../init_harness.py` commands are repository-checkout or vendor-neutral fallback usage, not the primary installed-skill experience.

Skill installation documentation must avoid machine-specific absolute paths. It should use portable paths such as `~/.codex/skills`, `~/.claude/skills`, project `.claude/skills`, and Cursor project rules under `.cursor/rules`, and explain which entry point applies to Codex, Claude Code, Cursor, and manual fallback use.

### Human Evaluation Lifecycle and Deferred Acceptance

Goal: make Human Product Evaluation a durable, optional acceptance layer that can be performed per Feature or after a batch of Features, while ensuring feedback about an unmet original commitment returns to that same Feature instead of becoming an automatic repair Feature.

Included scope: record human evaluation outcomes and feedback in durable run artifacts; keep machine Evaluator completion independent from human acceptance timing; reopen the original Feature when human feedback says its original acceptance criteria are not met; preserve attempts and history while allowing a human-reopened Feature to be selected again after it was blocked by an automatic retry limit; support batch evaluation over multiple completed Features; and classify feedback as either unmet current Feature scope or an independent new requirement before any new Feature is planned.

Excluded scope: requiring Human Eval before downstream Features can start; automatically creating or appending new Feature entries from free-form human feedback; changing the meaning of `EVAL_PASS`; treating a new requirement as evidence that the original Feature failed; resetting Feature history or attempts during reopen; or replacing SPEC normalization and Planning Agent decomposition.

Core flows: a project completes several Features through automatic evaluator gating and continues development without waiting for Human Eval; a human records a single or batch evaluation with per-Feature feedback; feedback classified as `current_feature` sets the original Feature back to non-done, records a reopen marker, and lets the orchestrator continue that Feature; feedback classified as `new_requirement` leaves the original Feature complete and creates a durable planning input without mutating `feature_list.json`; Planning Agent later normalizes the new requirement and appends a separately verifiable Feature; human acceptance can be recorded after implementation without blocking unrelated work.

Constraints: Human Eval state must be separate from machine Feature `status` and `passes`; batch evaluation must be attributable to a batch and individual Feature IDs; reopen must preserve unknown fields, feature ordering, attempts, and prior run history; a reopened Feature must not be permanently excluded merely because it previously reached the automatic attempt limit; invalid or ambiguous classifications must fail closed and ask for explicit triage; and all changes must work in visible template layout and generated hidden-layout installs.

Ambiguities or assumptions: the human or coordinating agent is responsible for deciding whether feedback contradicts the original acceptance criteria or requests independent new value; the harness records that decision but does not infer it from prose; a human pass is advisory product acceptance and does not replace the Evaluator Agent evidence required for machine completion; a batch may contain mixed outcomes and mixed classifications; a batch record is evidence and planning input, not a feature generator.

Required capabilities: a human-evaluation recording command or equivalent script with single and batch input; durable per-Feature and batch run records; Feature metadata for human-evaluation history and reopen intent; orchestrator selection logic for reopened Features; schema, validation, prompt, documentation, and contract-test coverage; and bundled template synchronization for installed projects.

Implementation paths: `scripts/`, `orchestrator.py`, `feature_list.json`, `schemas/feature_list.schema.json`, `runs/`, `Makefile`, `AGENTS.md`, `SPEC.md`, `README.md`, `docs/agent-workflow.md`, `prompts/continue.md`, `prompts/evaluate.md`, `prompts/plan.md`, `test/unit/`, `test/contract/`, and `skills/ai-agent-harness/assets/template/`.

Verification surface: unit tests for single and batch feedback routing, reopen behavior after `blocked`, preservation of attempts and unknown fields, and non-blocking acceptance; contract tests for the human/machine state boundary, explicit current-vs-new classification, Planning Agent handoff, and bundled template consistency; smoke tests for the recording command; `./init.sh`; and `scripts/validate-feature.sh` for each implemented Feature.

### Layered Verification

### Layout-Aware Provider Workspace Contract

Goal: allow provider child agents in hidden-layout projects to run from the project root and modify project-owned source while resolving every harness workflow path to the canonical `.agent-harness/` tree instead of stale or conflicting root-level files.

Included scope: define provider `cwd` as the vendor-neutral workspace switch; define harness and project paths relative to that provider workspace; render a shared layout-aware path contract into Planning, Coding, Evaluator, Continue, and Work-fast prompts; preserve visible-layout root-relative behavior; document that provider-specific directory flags such as Codex `--cd` must not overlap with `cwd`; synchronize generated hidden-layout instructions, the distributable skill, bundled template, and initializer install/repair/upgrade behavior; and add regression coverage with conflicting root and canonical sentinels.

Excluded scope: changing the orchestrator's own canonical working directory inside `.agent-harness/`; automatically deleting legacy root workflow files; inventing provider-specific command shapes for Claude Code, Cursor Agent, or custom providers; making environment variables an additional source of path truth; changing root `./init.sh` from the project recovery entry point; or weakening evaluator evidence requirements.

Core flows: `make -C .agent-harness work` starts the orchestrator inside the harness; the adapter resolves `cwd: ".."` relative to the harness directory and runs both runtime preflight and the real provider command from the project root; every role prompt states that paths are relative to the provider workspace, maps canonical workflow state, docs, scripts, prompts, tests, and runs to `.agent-harness/`, and keeps project-owned source, root `AGENTS.md`, and root `./init.sh` at project root; visible layout renders the same contract with root-relative harness paths; Work-fast prints an equivalent handoff for the current provider-native session.

Constraints: the adapter contract remains vendor-neutral and commands continue to run without a shell; `cwd` has one documented resolution base and is shared by preflight and real execution; prompt rendering has one layout source of truth rather than hand-maintained per-provider path guesses; hidden-layout legacy root files must remain unchanged during regression tests; generated and upgraded projects must receive the contract without overwriting project-owned state or merge-sensitive root recovery files; and feature completion still requires separate Evaluator evidence.

Ambiguities or assumptions: provider workspace means the effective cwd supplied by the adapter before the provider command starts; `cwd` is resolved relative to the harness directory containing `agent-provider.json`; hidden layout normally uses `cwd: ".."`, while visible layout normally uses `cwd: "."`; providers that change directory internally after adapter launch are outside the portable contract and must remove that overlapping behavior; Planning and Continue prompts are static/manual surfaces rather than current orchestrator child roles, but they must use the same renderer or explicit shared contract so their path semantics do not drift.

Required capabilities: deterministic layout detection from installed/template metadata or an equivalent single source; shared prompt-contract rendering; provider cwd normalization and validation; fake-provider fixtures that capture cwd and prompt content without relying on model behavior; hidden/visible initializer and upgrade fixtures; and contract, unit, harness, and smoke verification where appropriate.

Implementation paths: `orchestrator.py`, `scripts/run-agent-provider.py`, `agent-provider.example.json`, `prompts/`, `AGENTS.md`, `docs/agent-provider-configuration.md`, `docs/agent-workflow.md`, `skills/ai-agent-harness/SKILL.md`, `skills/ai-agent-harness/references/workflows.md`, `skills/ai-agent-harness/scripts/init_harness.py`, `skills/ai-agent-harness/assets/template/`, `test/unit/`, `test/contract/`, `test/harness/`, `feature_list.json`, `progress.md`, and `runs/`.

Verification surface: unit tests for layout detection, prompt rendering, and identical preflight/execution cwd; regression tests with stale root sentinels and canonical `.agent-harness` sentinels covering Coding, Evaluator, Planning or Continue, Work-fast, and run-evidence paths; visible-layout regression coverage; initializer hidden install/check/repair/upgrade tests; `./init.sh`; and `scripts/validate-feature.sh F042` after independent Evaluator evidence is recorded.

This remains one Feature because provider workspace selection and canonical prompt paths form one inseparable safety contract: either both agree or the child agent can still split state. Documentation, distribution synchronization, and regression fixtures directly verify that same behavior rather than delivering independent value.

### Template Version Source Consistency

Goal: make the template version reported by the manifest, initializer, bundled initializer, and tests consistent so install, check, repair, and upgrade decisions use one release value.

Included scope: align the current `0.3.9` template version across checked-in version sources and add a contract assertion that rejects future divergence.

Excluded scope: introducing a new release automation system, changing semantic versioning policy, or combining version synchronization with the behavioral acceptance decision for F042.

Core flows: initializer tests create and inspect manifests using the same version declared by `.agent-harness-template.json`; bundled initializer behavior matches the distributable initializer; contract verification fails if version sources drift.

Constraints: preserve existing installed-project state and upgrade semantics; do not edit the user's untracked provider configuration; keep the change independently verifiable from provider workspace behavior.

Ambiguities or assumptions: `0.3.9` is the intended current template version because it is already declared in the template manifest at HEAD; this Feature synchronizes existing sources rather than choosing a new release number.

Required capabilities: deterministic version-parity assertions and existing initializer test fixtures.

Implementation paths: `.agent-harness-template.json`, `skills/ai-agent-harness/scripts/init_harness.py`, the bundled initializer and tests under `skills/ai-agent-harness/assets/template/`, `test/harness/test_skill_initializer.py`, `test/contract/test_repository_contract.py`, `feature_list.json`, `progress.md`, and `runs/`.

Verification surface: initializer tests, version-parity contract tests, `./init.sh`, and `scripts/validate-feature.sh F043` after independent Evaluator evidence is recorded.

### Human Evaluation Rules in the Distributable Skill

Goal: ensure every installed copy of the AI Agent Harness skill teaches the same Human Evaluation lifecycle already implemented by the repository runtime.

Included scope: update the distributable `SKILL.md` and workflow reference with optional and deferred Human Eval guidance; document single and batch recording commands; require durable Feature metadata and run evidence; explain current-scope reopen versus new-requirement planning; and keep the bundled template copies and contract tests synchronized.

Excluded scope: changing the global skill installation automatically, making Human Eval a prerequisite for downstream work, replacing automatic Evaluator evidence, or inferring triage classifications from free-form feedback.

Core flows: an agent reads the installed skill and learns that automatic Evaluator completion may proceed without waiting for Human Eval; an operator records `make human-eval` or `make human-eval-batch`; current-scope feedback returns to the original Feature; independent new value becomes a Planning Agent input; and the run record plus `human_acceptance` metadata preserve the evidence chain.

Constraints: the repository-local distributable skill is the source artifact for future installs; root and bundled template guidance must agree; documentation must preserve the distinction between machine `EVAL_PASS` and human acceptance; tests must detect drift in the two skill documentation surfaces; and global user directories are not modified implicitly by repository work.

Ambiguities or assumptions: synchronizing the repository skill means updating the checked-in distributable skill and its bundled template, while updating a user's global `~/.codex/skills` copy remains an explicit installer or upgrade action; the runtime behavior is covered by F039/F040 and this Feature covers the instructional contract.

Required capabilities: synchronized skill documentation, workflow reference guidance, contract assertions for the lifecycle rules and bundled copies, and version/update guidance that points installed projects to the explicit skill-upgrade flow.

Implementation paths: `skills/ai-agent-harness/SKILL.md`, `skills/ai-agent-harness/references/workflows.md`, `skills/ai-agent-harness/assets/template/skills/ai-agent-harness/`, `test/contract/test_repository_contract.py`, the bundled contract test, `README.md`, `SPEC.md`, `feature_list.json`, and `progress.md`.

Verification surface: contract tests for both skill documentation surfaces and template parity; JSON/state validation; `./init.sh`; and `scripts/validate-feature.sh F041` after Evaluator evidence is recorded.

The template keeps automated checks in explicit layers:

- Unit tests cover small deterministic helper behavior.
- Contract tests lock repository rules, schema shape, prompt requirements, and orchestrator command guarantees.
- Harness tests are reserved for project-level workflow behavior and are optional in the minimal template.
- Smoke tests run the template's main user-facing verification commands end to end.

## 4. Acceptance Criteria

- `./init.sh` validates harness state and runs the tiny example tests.
- `scripts/validate-feature.sh F001` validates a feature by ID and runs the default verification entry point.
- `scripts/summarize-progress.sh` prints a concise status summary.
- Contract tests statically verify the orchestrator CLI and startup contract.
- The documented default one-feature work entrypoint runs through the orchestrator before manual fallback.
- Orchestrator agent providers are explicitly configurable and fail closed when unconfigured, missing, or ambiguous.
- Contract tests verify AI-facing obligations for state safety, external behavior verification, prompt restrictions, and evaluator gating.
- `feature_list.json` conforms to `schemas/feature_list.schema.json`.
- `prompts/plan.md`, `prompts/work.md`, `prompts/continue.md`, and `prompts/evaluate.md` define the standard agent roles.
- The tiny example can be tested without installing third-party dependencies.
- The Go server example can be tested with `go test ./...` when Go is installed.
- `AGENTS.md` includes external behavior verification and external tool schema guardrails.
- `docs/capability-gaps.md`, prompts, and contract tests require missing capabilities to become durable setup, tests, docs, adapters, CI configuration, blocked state, or follow-up features instead of local-only bypasses.
- `docs/example-boundaries.md`, prompts, and contract tests require project-level requirements to land outside default examples unless the feature explicitly targets example maintenance.
- Root `./init.sh` behavior for installed projects distinguishes harness verification from project recovery and requires a runnable skeleton after minspec acceptance.
- Planning governance requires minspec-to-SPEC normalization with explicit goal, included scope, excluded scope, core flows, constraints, ambiguities, capabilities, implementation paths, and verification surface before feature entries are appended.
- `./init.sh` runs unit, contract, smoke, and optional harness tests.
- `docs/README.md`, `QUALITY.md`, and `runs/RUN_TEMPLATE.md` are present and validated.
- `scripts/check-failure-domains.sh` verifies failed run records include failure-domain and harness-improvement fields.
- Evaluator-evidence checks prevent done features after the enforcement baseline from lacking an `EVAL_PASS: Fxxx` run record.
- `make ci` runs the CI verification path.
- `.github/workflows/ci.yml` runs `make ci` on GitHub Actions.
- `make clean` resets `feature_list.json`, `progress.md`, and recorded run artifacts for a fresh project.
- README explains the project as a repository-level harness for resumable AI coding, not a prompt collection.
- README links to the new-project flow guide and the guide includes a visual diagram of the skill-assisted path.
- README and `docs/real-world-usage.md` link real projects that informed the harness design.
- `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, and GitHub issue templates are present.
- `skills/ai-agent-harness/` contains a distributable skill with initialization, planning, one-feature work, evaluation, and explicit finalize-and-commit workflows.

## 5. Verification Plan

Run:

```bash
./init.sh
scripts/validate-feature.sh F001
scripts/summarize-progress.sh
python3 orchestrator.py --dry-run
make ci
```

Run `python3 orchestrator.py --dry-run` and `scripts/validate-feature.sh F001` outside `./init.sh`; both commands call `./init.sh` and should not be nested inside tests run by `./init.sh`.

## 6. Project Minspec: Revive Obsidian Mind Map

### Goal

Restore the abandoned `obsidian-mind-map` plugin so a user on a current Obsidian release can open a Markdown note as the familiar Markmap-based mind-map preview instead of receiving a blank or `No content found` pane.

### Scope included

- Adopt a reproducible, current TypeScript build that emits the Community Plugin runtime artifacts (`main.js`, `manifest.json`, and CSS when required).
- Open the preview through supported Obsidian workspace/view-state APIs and render the selected Markdown file with the existing Markmap visual language and configurable node spacing.
- Keep an unpinned preview synchronized with Markdown navigation and note edits; preserve a pinned source note and restore its state across layout reloads.
- Preserve supported internal-link navigation and screenshot copying, with user-visible failure handling where browser or clipboard capabilities are unavailable.
- Produce a locally installable release bundle and concise installation/verification documentation for a maintained fork.

### Scope excluded

- Turning the preview into a full visual mind-map editor or writing changes back into Markdown.
- Replacing Markmap with a different rendering engine or redesigning the original visual identity.
- AI generation, vault-wide graph visualization, collaboration, sync, or cloud services.
- Publishing to the official Obsidian Community Plugins registry, transferring the original plugin ID, or pushing a release to a remote repository without separate user authorization.
- Claiming mobile compatibility until it has a dedicated runtime verification surface; desktop Obsidian is the initial acceptance target.

### Core flows

1. A developer checks out the repository, runs root `./init.sh`, and obtains a verified build plus a real Markdown-to-mind-map core smoke check without relying on prior chat or manual setup.
2. A user opens a Markdown note, invokes `Mind Map: Preview the current note as a Mind Map`, and sees a non-empty Markmap preview in the configured split direction.
3. While unpinned, changing or editing the active Markdown note updates the preview; while pinned, navigation does not replace the selected source note; reopening the saved layout restores that source.
4. Internal links remain actionable and `Copy screenshot` either places an image on the clipboard or reports a clear unsupported/error notice.
5. A maintainer builds a release bundle whose manifest and artifacts can be copied into a vault plugin folder and loaded by current desktop Obsidian.

### Constraints

- Use public, current Obsidian plugin APIs and avoid the obsolete direct `WorkspaceLeaf.open(customView)` construction path for normal activation.
- Preserve user data and settings; do not modify note contents.
- Keep plugin runtime dependencies bundled and Obsidian itself external.
- Avoid global DOM identifiers/selectors that make one view delete or mutate another view's SVG.
- Feature completion requires automated verification plus durable independent Evaluator evidence under `.agent-harness/runs/`.
- No commit, push, release publication, or Community Plugins submission occurs without explicit user approval.

### Ambiguities or assumptions

- “The original page looks good” is interpreted as preserving the existing Markmap tree presentation and theme-derived text styling, not pixel-identical rendering against a six-year-old Obsidian build.
- The reported failure is treated as the known current-runtime blank-preview regression; exact user-vault console errors are not yet available, so runtime verification must capture errors before final acceptance.
- Desktop macOS Obsidian is the available real-app verification environment. Windows, Linux, and mobile remain follow-up verification rather than implied acceptance.
- The maintained fork may retain the existing plugin ID for local testing, but official registry ownership and naming require a later distribution decision.

### Required capabilities

- Declared Node.js/npm toolchain, current Obsidian type definitions, TypeScript bundler, deterministic tests, and a release packaging command.
- A project-owned fixture that transforms representative Markdown (headings, lists, front matter, and internal links) without requiring an interactive vault.
- A current desktop Obsidian instance plus CLI/dev-console access for reload, error capture, DOM inspection, and screenshot evidence.
- A temporary or explicitly selected test vault for runtime installation; no user's production vault will be mutated by default.
- Explicit provider configuration for Harness child-agent evaluation before any feature can become complete.

### Implementation paths

- Runtime and view logic: `src/`.
- Build, dependency, manifest, and package scripts: `package.json`, lockfile, `tsconfig.json`, bundler configuration, `manifest.json`, and `styles.css` when needed.
- Project recovery and smoke verification: root `init.sh`, project-owned `tests/` and fixtures.
- Installation and release documentation: `README.md` and project-owned release scripts/configuration.
- Durable planning, progress, and evaluation evidence: `.agent-harness/feature_list.json`, `.agent-harness/progress.md`, and `.agent-harness/runs/`.

### Verification surface

- Root `./init.sh` from a fresh or already-initialized checkout.
- Type checking, production bundle build, unit tests, and Markdown transform smoke tests.
- Artifact inspection confirming the manifest and runtime files are present and loadable.
- Obsidian CLI reload followed by developer error/console inspection, DOM inspection for a rendered SVG, and a visual screenshot in a test vault.
- Feature-specific validation and independent `EVAL_PASS: Fxxx` evidence.

### Feature decomposition

- `F044` establishes the runnable project recovery and build/test capability required by every later feature.
- `F045` restores the independently visible core behavior: opening and rendering one current Markdown note.
- `F046` owns the separate workspace lifecycle behavior for live following, pinning, and layout restoration.
- `F047` owns interaction/export behavior whose browser, link, and clipboard risks can fail independently of rendering.
- `F048` owns distributable artifacts and real-app installation evidence; official marketplace publication remains outside this requirement.

These are separate because they have distinct implementation and verification boundaries. In particular, a plugin can build without rendering, render without restoring state, and render successfully while clipboard export or packaging still fails.
