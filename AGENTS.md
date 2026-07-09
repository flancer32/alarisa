# Root Level

- Path: `AGENTS.md`
- Template Version: `20260702`
- Changed: `20260709`

## Purpose

Root-level working rules for the Alarisa product repository.

This is a **two-repository ADSM project**: the product code lives here, the cognitive context is in `ctx/` (mounted as a separate repo).

## Level Boundary

Defines:

- boundary between this product repository and the `ctx/` cognitive context.
- root-level protection and escalation rules.

Does NOT define:

- product meaning, requirements, or domain knowledge (see `ctx/docs/`).
- implementation-level structure.

## Two-Repository Topology

- **Product repository** (this one) — the implementation code for Alarisa.
- **Context repository** (`ctx/`) — the cognitive context, mounted here as a separate git tree.

The cognitive context is authoritative. Consult `ctx/AGENTS.md` and `ctx/docs/` before making product decisions.

Do not mix changes between the two repositories. Do not remove, replace, or relocate `ctx/`.

## Root File Protection

Do not modify this file, `.gitignore`, or `README.md` unless explicitly instructed by the human.
