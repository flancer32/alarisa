#!/usr/bin/env bash
# Loads the current user's nvm default Node.js version and starts the Alarisa npm application.

set -Eeuo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  printf 'ERROR: nvm is not installed at %s\n' "$NVM_DIR" >&2
  exit 1
fi

# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm use --silent default >/dev/null
exec npm start
