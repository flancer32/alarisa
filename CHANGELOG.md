# Changelog

## [0.3.0] - 2026-07-16 - Multi-application server composition

### Added

- Added a host-owned manual desktop/mobile channel choice at `/`.
- Added independent `/desk/` and `/mob/` static mounts and reserved `/hooks/`, `/.well-known/`, and `/_ops/` zones.
- Added the shared `comm` Principal API handler and durable `back` ingress composition.

### Changed

- Renamed the server composition component to `Alarisa_Host_Bootstrap` to avoid the reusable `Alarisa_Back_` namespace.
- Moved server runtime configuration into `@flancer32/alarisa-back` and made the data root absolute.

## [0.2.0] - 2026-07-09 - TeqFW CLI bootstrap baseline

### Added
- Added TeqFW namespace metadata for `Alarisa_` mapped to `./src`.
- Added `bin/cli.mjs` as the Node.js console entrypoint using `@teqfw/di`.
- Added minimal `Alarisa_Back_Bootstrap` root component with console startup report.
- Added a unit test for bootstrap startup and container resolution.

## [0.1.0] - 2026-07-09 - Initial Node.js project baseline

### Added
- Added initial `package.json` metadata for the Alarisa Node.js host project.
- Added `jsconfig.json` for editor and JavaScript type-checking baseline.
- Added `types.d.ts` as the package declaration entry point.
- Added this changelog.
