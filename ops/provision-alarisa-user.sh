#!/usr/bin/env bash

set -Eeuo pipefail

DEFAULT_USER="al-user"
ALARISA_USER="${ALARISA_USER:-$DEFAULT_USER}"
DRY_RUN=0
POSITIONAL_SEEN=0
SSH_CONFIG_DIR="/etc/ssh/sshd_config.d"

usage() {
  cat <<'EOF'
Provision the unprivileged Linux account used by Alarisa.

Usage:
  provision-alarisa-user.sh [--dry-run] [USER]

Arguments:
  USER        Linux account name (default: al-user; may also be set with
              ALARISA_USER).

Options:
  --dry-run   Print planned changes without modifying the system.
  -h, --help  Show this help.

Run this script as root. It creates the account and directories, configures a
user-local npm prefix and login PATH, and denies direct SSH login for the user.
It does not install Alarisa, Node.js, npm, or any agent CLI.
EOF
}

log() {
  printf '%s\n' "$*"
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

run() {
  if ((DRY_RUN)); then
    printf '+ '
    printf '%q ' "$@"
    printf '\n'
  else
    "$@"
  fi
}

while (($#)); do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --*)
      die "Unknown option: $1"
      ;;
    *)
      ((POSITIONAL_SEEN == 0)) || die "Specify the user only once."
      [[ "$ALARISA_USER" == "$DEFAULT_USER" || "$ALARISA_USER" == "$1" ]] || \
        die "Specify the user once, either as an argument or ALARISA_USER."
      ALARISA_USER="$1"
      POSITIONAL_SEEN=1
      ;;
  esac
  shift
done

if ((DRY_RUN == 0)); then
  ((EUID == 0)) || die "Run this script as root."
fi
[[ "$ALARISA_USER" =~ ^[a-z_][a-z0-9_-]{0,31}$ ]] || \
  die "Invalid Linux user name: $ALARISA_USER"
[[ "$ALARISA_USER" != "root" ]] || die "Refusing to provision root."

LOGIN_SHELL="$(command -v bash || true)"
[[ -n "$LOGIN_SHELL" ]] || die "Bash is required but was not found."

PRIVILEGED_GROUPS=(sudo wheel adm docker lxd incus libvirt kvm)
check_privileged_groups() {
  local user_groups group
  user_groups="$(id -nG "$ALARISA_USER" 2>/dev/null || true)"
  for group in "${PRIVILEGED_GROUPS[@]}"; do
    if [[ " $user_groups " == *" $group "* ]]; then
      die "User $ALARISA_USER belongs to privileged group '$group'; remove it manually and rerun."
    fi
  done
}

if getent passwd "$ALARISA_USER" >/dev/null; then
  HOME_DIR="$(getent passwd "$ALARISA_USER" | cut -d: -f6)"
  check_privileged_groups
  run usermod --shell "$LOGIN_SHELL" "$ALARISA_USER"
else
  HOME_DIR="/home/$ALARISA_USER"
  if getent group "$ALARISA_USER" >/dev/null; then
    run useradd --create-home --shell "$LOGIN_SHELL" --gid "$ALARISA_USER" "$ALARISA_USER"
  else
    run useradd --create-home --shell "$LOGIN_SHELL" --user-group "$ALARISA_USER"
  fi
fi

run passwd --lock "$ALARISA_USER"
if ((DRY_RUN == 0)) || getent passwd "$ALARISA_USER" >/dev/null; then
  check_privileged_groups
fi

run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0750 "$HOME_DIR/alarisa"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0750 "$HOME_DIR/alarisa/app"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/alarisa/work"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/alarisa/var"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/.config/alarisa"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/.config/alarisa/agents"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/.config/alarisa/workers"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/.config/alarisa/profiles"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/.config/alarisa/tools"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/.config/alarisa/orchestration"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/.local/bin"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/.local/npm"
run install -d -o "$ALARISA_USER" -g "$ALARISA_USER" -m 0700 "$HOME_DIR/.cache/alarisa"

PROFILE="$HOME_DIR/.profile"
PROFILE_START="# BEGIN ALARISA MANAGED PATH"
PROFILE_END="# END ALARISA MANAGED PATH"
PROFILE_BLOCK=$(cat <<'EOF'
# BEGIN ALARISA MANAGED PATH
export NPM_CONFIG_PREFIX="$HOME/.local/npm"
export PATH="$HOME/.local/bin:$HOME/.local/npm/bin:$PATH"
# END ALARISA MANAGED PATH
EOF
)

if ((DRY_RUN)); then
  log "+ ensure managed PATH block in $PROFILE"
else
  touch "$PROFILE"
  chown "$ALARISA_USER:$ALARISA_USER" "$PROFILE"
  chmod 0640 "$PROFILE"
  PROFILE_START_COUNT="$(grep -Fxc "$PROFILE_START" "$PROFILE" || true)"
  PROFILE_END_COUNT="$(grep -Fxc "$PROFILE_END" "$PROFILE" || true)"
  if [[ "$PROFILE_START_COUNT" != "$PROFILE_END_COUNT" ]] || ((PROFILE_START_COUNT > 1)); then
    die "Malformed Alarisa PATH block in $PROFILE; repair it manually."
  fi
  PROFILE_TMP="$(mktemp "$HOME_DIR/.profile.XXXXXX")"
  if ((PROFILE_START_COUNT == 1)); then
    awk -v start="$PROFILE_START" -v end="$PROFILE_END" -v block="$PROFILE_BLOCK" '
      $0 == start { if (!done) print block; done=1; skip=1; next }
      $0 == end && skip { skip=0; next }
      !skip { print }
    ' "$PROFILE" >"$PROFILE_TMP"
  else
    cp "$PROFILE" "$PROFILE_TMP"
    printf '\n%s\n' "$PROFILE_BLOCK" >>"$PROFILE_TMP"
  fi
  if ! cmp -s "$PROFILE_TMP" "$PROFILE"; then
    PROFILE_BACKUP="$PROFILE.bak.$(date -u +%Y%m%dT%H%M%SZ)"
    cp --preserve=all "$PROFILE" "$PROFILE_BACKUP"
    mv "$PROFILE_TMP" "$PROFILE"
  else
    rm -f "$PROFILE_TMP"
  fi
  chown "$ALARISA_USER:$ALARISA_USER" "$PROFILE"
  chmod 0640 "$PROFILE"
fi

SSH_FILE="$SSH_CONFIG_DIR/90-alarisa-deny-$ALARISA_USER.conf"
SSH_CONTENT=$(cat <<EOF
# Managed by provision-alarisa-user.sh. Direct SSH login is denied; sudo -iu remains available.
DenyUsers $ALARISA_USER
EOF
)

if ((DRY_RUN)); then
  log "+ validate and install $SSH_FILE with: DenyUsers $ALARISA_USER"
else
  command -v sshd >/dev/null || die "sshd is required but was not found."
  install -d -o root -g root -m 0755 "$SSH_CONFIG_DIR"
  sshd -t || die "Existing SSH configuration is invalid; no SSH changes were made."
  SSH_TMP="$(mktemp "$SSH_CONFIG_DIR/.alarisa-ssh.XXXXXX")"
  SSH_BACKUP=""
  SSH_CHANGED=0
  SSH_EXISTED=0
  cleanup() { rm -f "$SSH_TMP"; }
  trap cleanup EXIT
  printf '%s\n' "$SSH_CONTENT" >"$SSH_TMP"
  chown root:root "$SSH_TMP"
  chmod 0644 "$SSH_TMP"

  if [[ -f "$SSH_FILE" ]]; then
    SSH_EXISTED=1
    if ! cmp -s "$SSH_TMP" "$SSH_FILE"; then
      SSH_BACKUP="$SSH_FILE.bak.$(date -u +%Y%m%dT%H%M%SZ)"
      cp --preserve=all "$SSH_FILE" "$SSH_BACKUP"
    fi
  fi

  if [[ ! -f "$SSH_FILE" ]] || ! cmp -s "$SSH_TMP" "$SSH_FILE"; then
    install -o root -g root -m 0644 "$SSH_TMP" "$SSH_FILE"
    SSH_CHANGED=1
  fi

  if ! sshd -t; then
    if ((SSH_CHANGED)); then
      if ((SSH_EXISTED)); then
        cp --preserve=all "$SSH_BACKUP" "$SSH_FILE"
      else
        rm -f "$SSH_FILE"
      fi
    fi
    sshd -t || die "SSH configuration remains invalid after rollback; inspect it immediately."
    die "Proposed SSH configuration was invalid and has been rolled back."
  fi

  if systemctl is-active --quiet ssh.service; then
    systemctl reload ssh.service
  elif systemctl is-active --quiet sshd.service; then
    systemctl reload sshd.service
  else
    log "SSH service is not active; configuration was validated but not reloaded."
  fi
fi

log "Provisioning complete for: $ALARISA_USER"
log "Home: $HOME_DIR"
log "Administrator login: sudo -iu $ALARISA_USER"
log "Next: place the controlled project checkout in $HOME_DIR/alarisa/app, create its .env with mode 0600, and install dependencies with npm ci as $ALARISA_USER."
log "Verify: id $ALARISA_USER; getent passwd $ALARISA_USER; sshd -t"
