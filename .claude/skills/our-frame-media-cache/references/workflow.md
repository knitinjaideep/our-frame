# Our Frame Media Cache Workflow

Implement the media-cache migration sequentially.

Do not run dependent implementation phases in parallel.

## Work Item Flow

### 1. Read

Read:

- `.claude/CLAUDE.md`
- applicable `.claude/rules/`
- `docs/media-cache/STATE.md`
- task specification
- relevant architecture docs
- relevant implementation

### 2. Inspect Before Changing

Determine:

- what already exists
- what can be reused
- what must be modified
- what would duplicate legacy behavior

### 3. Implement

Use `our-frame-implementer`.

The implementer must not commit.

### 4. Review

Use `our-frame-reviewer`.

The reviewer must independently inspect:

- work-order requirements
- git diff
- related implementation
- privacy/access implications
- media performance implications
- tests/checks

Reviewer may fix ordinary defects.

### 5. Verify

Use `our-frame-verifier`.

Verification should run task-specific checks plus build/syntax checks relevant to changed files.

### 6. Resolve Failures

If verification fails:

- fix root cause
- do not disable checks
- rerun verification

### 7. Update State

Only after PASS:

- update `docs/media-cache/STATE.md`
- record completed task
- record checks run
- record commit SHA after commit

## Stop Conditions

Stop and request human input when:

- requirements conflict
- a destructive migration is necessary
- media privacy policy is ambiguous
- production storage choice is required but not specified
- verification repeatedly fails for the same reason

Routine implementation decisions are not blockers.

## Forbidden Autonomous Actions

Do not:

- force push
- reset hard
- deploy
- remove user data
- delete Drive originals
- make private media public
