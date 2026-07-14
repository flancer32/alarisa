#!/usr/bin/env bash
# Installs the pinned nvm, Node.js, and bundled npm versions for the current Alarisa user.

set -Eeuo pipefail

NVM_VERSION="v0.40.5"
NODE_VERSION="24.18.0"

if ((EUID == 0)); then
  printf '%s\n' 'ERROR: Run this script as the dedicated Alarisa user, not root.' >&2
  exit 1
fi

for command in curl bash; do
  command -v "$command" >/dev/null || {
    printf 'ERROR: Required command not found: %s\n' "$command" >&2
    exit 1
  }
done

installer="$(mktemp)"
trap 'rm -f "$installer"' EXIT
curl --fail --show-error --location \
  "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" \
  --output "$installer"
bash "$installer"

export NVM_DIR="$HOME/.nvm"
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm install "$NODE_VERSION"
nvm alias default "$NODE_VERSION"
node --version
npm --version
