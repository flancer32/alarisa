# Alarisa

<img src="web/alarisa.webp" alt="Alarisa avatar" width="128" align="right">

Alarisa is a private, human-controlled personal digital avatar for one Principal in the digital world.

It runs as a personal PWA plus an always-active runtime on a dedicated VPS — a persistent web application that receives signals, maintains state over time, and orchestrates approved capabilities on the Principal's behalf.

## Product

- **One instance per Principal.** Alarisa is not a multi-user SaaS or a shared workspace.
- **PWA chat (MVP).** The first interaction is chat through the PWA.
- **Context and memory.** Personal goals, preferences, constraints, and active work are preserved for continuity.
- **Capability orchestration.** AI agents, tools, workflows, and external services as capabilities mature.
- **Confirmation for risk.** Actions that may harm the Principal require explicit confirmation.

Cognitive context is maintained in `ctx/` (separate repository, mounted here).
