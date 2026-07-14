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

## Configuration

The Node.js application loads its runtime configuration from `.env` in the project root. Start with [.env.example](.env.example):

```bash
cp .env.example .env
```

Supported settings are:

- `HOST` — bind host; defaults to `127.0.0.1` for the Apache reverse-proxy deployment.
- `PORT` — HTTP port from `1` to `65535`; defaults to `3000`.
- `SERVER_TYPE` — `http`, `http2`, or `https`; defaults to `http`.
- `ALARISA_DATA_ROOT` — application runtime-data path; defaults to `var`.
- `~/.config/alarisa/` is reserved for future infrastructure configuration for workers, subagents, execution profiles, tools, and orchestration; it is not currently loaded as application runtime configuration.

The application `.env` is distinct from `~/.config/alarisa/` and from native Codex, Claude Code, and OpenCode configuration. Keep secrets out of logs and set `.env` permissions to `0600` in deployments.

For local diagnostics, CLI flags `--port=<port>` and `--type=<server-type>` override the corresponding `.env` values. `--port=0` requests an ephemeral test port.
