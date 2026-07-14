#!/usr/bin/env bash
# Loads the current user's nvm default Node.js version and starts the Alarisa npm application.

set -Eeuo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
LOG_DIR="$HOME/alarisa/var/log"
LOG_FILE="$LOG_DIR/application.log"

if [[ ! -d "$LOG_DIR" ]]; then
  printf 'ERROR: application log directory is missing: %s\n' "$LOG_DIR" >&2
  exit 1
fi

# This launcher runs as the application user, so it creates and appends the log
# with that user's ownership rather than with systemd manager (root) ownership.
exec >>"$LOG_FILE" 2>&1

if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  printf 'ERROR: nvm is not installed at %s\n' "$NVM_DIR" >&2
  exit 1
fi

# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm use --silent default >/dev/null
exec npm start
