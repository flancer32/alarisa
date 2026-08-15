---
name: project-conventions
description: Project-specific conventions for every task in the @flancer32/alarisa repository.
---

# Project Conventions

`AGENTS.md` overrides this file.

## Repositories

- The product repository is `flancer32/alarisa`; the mounted cognitive-context repository is `flancer32/alarisa-ctx` at `ctx/`.
- The root repository and `ctx/` are separate repositories; do not mix their status, commits, or pushes.
- `ctx/` is the authoritative cognitive context. Read `ctx/AGENTS.md` and relevant `ctx/docs/` before changing product decisions or boundaries.

## Workflow

- Work in each repository's `main` branch. This project rule overrides any GitHub-skill instruction to use a separate branch.
- At the start of work, check upstream in the root and `ctx/`; keep each local `main` synchronized by fast-forwarding when safe.
- Before changes, inspect every affected working tree.
- Do not modify `ctx/` unless the task explicitly requires a context change.
- Do not commit or push unless the user requests it.
- Ask the user when a missing decision changes behavior or grants external authority.

## Communication

- User: Russian; code, comments, documentation, commits, and identifiers: English.
- Report changes, verification, and remaining risks.

## Project boundaries

- `@flancer32/alarisa` is the Node.js ESM self-hosted server composition root, not a replacement for the reusable `@flancer32/alarisa-back` package.
- Keep global HTTP route mapping, browser-package mounting, runtime configuration, and database lifecycle in this host. Keep server implementation in `back`, shared client/server transport contracts in `comm`, and browser applications in `desk` or `mob` packages.
- Preserve the official package areas `back`, `desk`, `mob`, `android`, `ios`, and `comm`; do not create a package merely for naming symmetry.
- Do not copy package-owned browser resources into this repository. The host publishes desktop resources at `/desk/` and mobile resources at `/mob/`; `/` remains a manual channel choice without automatic redirect.

## Validation

- Run `npm test` for changed implementation or tests.
- Run `teqfw-esm-validator src` for changes under `src/`; it does not apply to package metadata, tests, public assets, or documentation.
- Use `adsm-ctx` for structural validation of the separate `ctx/` repository.
- Run `git diff --check` in every affected repository after changes.

## GitHub

- In all multiline text sent to GitHub, including issues and comments, use actual line breaks; never send literal `\n`, which GitHub displays as text.

## Shared memory

- `flancer32/ai-memo` is the shared cross-project issue tracker and memory. Source identity: `flancer32/alarisa`. Note path: `project/flancer32/alarisa/`. Resolvers: `flancer32/alarisa` and, for context-owned issues, `flancer32/alarisa-ctx`.
- Every issue must name the project or projects expected to resolve it.
- When referring to a commit in another repository, use its full GitHub URL: `https://github.com/vendor/name/commit/<sha>`.
