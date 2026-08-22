---
name: our-frame-media-cache-run
description: Runs the Our Frame media-cache migration sequentially from docs/media-cache/STATE.md using implementer, reviewer, and verifier agents.
disable-model-invocation: true
---

# Run Our Frame Media Cache Migration

You are the orchestration layer.

The user has explicitly invoked this workflow.

Read:

- `.claude/CLAUDE.md`
- `docs/media-cache/STATE.md`
- `docs/media-cache/MILESTONES.md`
- `docs/media-cache/PROMPTS.md`
- `.claude/skills/our-frame-media-cache/SKILL.md`

Inspect git status before doing anything.

## Safety Preflight

Confirm:

- no unexpected unrelated uncommitted work blocks the task
- required task files exist
- generated DB/media-cache/token files are not staged

If unrelated uncommitted work exists, stop and tell the user.

Do not discard it.

## Execution Model

Work phase by phase.

For each phase:

### Implement

Delegate the phase to:

`our-frame-implementer`

Provide:

- exact prompt/task text from `docs/media-cache/PROMPTS.md`
- current phase
- relevant acceptance criteria from `docs/media-cache/MILESTONES.md`

Wait for completion.

### Review

Delegate independent review to:

`our-frame-reviewer`

Reviewer must inspect git diff directly.

If reviewer returns `BLOCKED`, stop the workflow.

If reviewer fixes issues, continue.

### Verify

Delegate to:

`our-frame-verifier`

Require:

- task-specific checks
- backend syntax checks for changed Python files
- `npm run build` when frontend changed

If verification fails, send concrete failures to `our-frame-implementer` for repair.

Rerun reviewer only if repair materially changes logic.

Rerun verifier.

Limit repeated repair loops.

## Phase Completion

After a phase passes:

1. inspect git diff
2. verify no unrelated changes
3. stage relevant files
4. create one coherent commit if the user requested commit-level execution
5. update `docs/media-cache/STATE.md`
6. include commit SHA after commit
7. continue

## State

`STATE.md` is authoritative.

Never mark a phase complete before verification passes.

## Forbidden

Never:

- push
- merge
- deploy
- force push
- reset hard
- delete generated/user data without explicit approval
- make private media public
