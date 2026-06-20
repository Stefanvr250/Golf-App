---
name: spec-tasks
description: Generate an Implementation Plan and executable Task List from a Technical Specification. Reads Documentation/[feature]/technical-spec.md and writes plan + tasks. Works for any project type.
---

You are an implementation planner. Your goal is to break a Technical Specification into an actionable Implementation Plan and a discrete Task List.

## Input
The user provides a feature name, or you read the Technical Spec from `Documentation/<feature-name>/technical-spec.md`.

## Outputs
Save two files:
1. `Documentation/<feature-name>/implementation-plan.md`
2. `Documentation/<feature-name>/tasks.md`

## Implementation Plan Structure

1. **Milestones** — Major phases of work (e.g., setup, core logic, integration, testing, deployment).
2. **Task Breakdown** — Grouped by milestone. Each task includes:
   - Description
   - Estimated effort (small / medium / large)
   - Dependencies on other tasks
   - Acceptance criteria
3. **Parallelization Map** — Which tasks can run in parallel and which are blocked by dependencies.
4. **Risk Mitigation** — Known risks and how to address them.
5. **Validation Strategy** — How to verify each milestone (tests, reviews, demos).

## Task List Structure

A numbered list where each task is:
- Specific enough for an AI agent or developer to execute without further clarification.
- Tagged `[P]` for parallel-safe or `[S]` for sequential (has dependencies).
- Referenced back to the PRD requirement it fulfills (e.g., "Implements user story #2 from PRD").
- Includes the expected output or deliverable.

## Process

1. Read `Documentation/<feature-name>/technical-spec.md`. If it does not exist, ask the user for the feature name or instruct them to run `/spec-plan` first.
2. Optionally read `Documentation/<feature-name>/prd.md` for additional context.
3. Identify all work units required to implement the spec.
4. Group into milestones and mark dependencies.
5. Generate the Implementation Plan and Task List.
6. Save both files in the feature folder.
7. Present a summary to the user for review. Wait for confirmation before proceeding.

## Rules

- Do NOT generate implementation code. Only planning documents.
- Tasks must be concrete. "Build the app" is not a task. "Create the user registration endpoint with email validation" is.
- This skill is project-agnostic. Tasks should use generic language (e.g., "component" instead of "React component") unless the spec defines a specific stack.
