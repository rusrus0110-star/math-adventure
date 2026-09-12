# AGENTS.md

## Project principles

Work as a senior software engineer.

Before making non-trivial changes:

1. Inspect the relevant existing code.
2. Understand the current architecture and data flow.
3. Explain the proposed solution.
4. Prefer the smallest safe change.
5. Preserve existing functionality unless explicitly asked otherwise.
6. Run appropriate validation after changes.

Do not rewrite large parts of the application unless there is a clear technical reason.

---

## Code quality

Write clean, readable, modular production-quality code.

Prefer:

- small focused functions;
- clear naming;
- explicit control flow;
- reusable modules;
- separation of concerns;
- minimal duplication.

Avoid:

- unnecessary abstractions;
- premature optimization;
- giant components;
- giant service files;
- hidden side effects;
- duplicated business logic;
- magic numbers;
- silent error handling.

---

## JavaScript / TypeScript

Use modern JavaScript.

Prefer:

- ES Modules;
- async/await;
- const by default;
- optional chaining where appropriate;
- nullish coalescing where appropriate;
- explicit error handling.

Do not introduce CommonJS unless required by an existing dependency.

Do not suppress errors without a documented reason.

---

## React

Use functional components and hooks.

Keep:

- UI components focused on presentation;
- business logic outside large JSX components;
- reusable logic in custom hooks when appropriate;
- state as local as possible.

Avoid unnecessary useEffect usage.

Do not store derived data in state when it can be calculated from existing state or props.

Do not mutate state directly.

Maintain accessibility and semantic HTML.

---

## Backend

Keep backend layers separated where practical:

routes
→ controllers
→ services
→ repositories / data access

Routes should not contain business logic.

Controllers should remain thin.

Business logic belongs in services.

Database-specific logic belongs in the data-access layer.

---

## SQL

Never concatenate user-controlled input into SQL strings.

Always use parameterized queries or prepared statements.

Consider:

- indexes;
- query complexity;
- unnecessary SELECT \*;
- N+1 queries;
- transaction boundaries;
- data integrity constraints.

Do not alter database schemas without explicitly describing the migration impact.

---

## Error handling

Never silently swallow exceptions.

Errors should contain enough context for debugging without leaking secrets.

Backend errors should be handled centrally when the project architecture supports it.

Distinguish between:

- validation errors;
- authentication errors;
- authorization errors;
- not-found errors;
- conflicts;
- internal server errors.

---

## Security

Never expose, print, commit, or modify secrets unnecessarily.

Treat the following as sensitive:

- .env
- API keys
- access tokens
- refresh tokens
- passwords
- private keys
- database credentials

Never commit secret values.

Never disable authentication, authorization, validation, or security checks merely to make something work.

Validate untrusted input.

---

## Dependencies

Do not install a new dependency when the existing stack can solve the problem cleanly.

Before introducing a dependency:

1. explain why it is needed;
2. check whether an existing dependency already solves the problem;
3. prefer maintained and widely adopted packages.

Do not perform major dependency upgrades unless explicitly requested.

---

## Git

Before substantial changes, inspect:

git status
git diff

Do not:

- reset unrelated user changes;
- force-push;
- rewrite Git history;
- delete branches;
- commit secrets.

Keep changes scoped to the requested task.

Before declaring a task finished, inspect the final diff.

---

## Testing

After code changes, run the relevant available checks.

Depending on the project, this may include:

npm test

npm run lint

npm run build

npm run typecheck

Only run scripts that actually exist in package.json.

If validation fails, investigate the cause rather than hiding the failure.

Clearly report any remaining failures.

---

## Workflow

For non-trivial tasks use:

ANALYZE
→ PLAN
→ IMPLEMENT
→ TEST
→ REVIEW DIFF

Do not immediately start editing when the request requires architectural reasoning.

For potentially destructive or broad changes, present the plan before implementation.

---

## Completion criteria

A task is complete only when:

- requested behavior is implemented;
- relevant errors are handled;
- existing behavior has not obviously regressed;
- available tests/checks have been run;
- final git diff has been reviewed;
- no secrets or unrelated files were added.
