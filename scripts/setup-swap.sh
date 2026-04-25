#!/usr/bin/env bash
set -euo pipefail

SWAPFILE="${SWAPFILE:-/swapfile}"
SIZE_MB="${SIZE_MB:-2048}"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    exec sudo -n -- "$0" "$@"
  fi
  echo "Run as root or install sudo before enabling swap." >&2
  exit 1
fi

if swapon --show | awk '{print $1}' | grep -qx "$SWAPFILE"; then
  echo "Swapfile already active: $SWAPFILE"
  exit 0
fi

if [[ ! -f "$SWAPFILE" ]]; then
  fallocate -l "${SIZE_MB}M" "$SWAPFILE" || dd if=/dev/zero of="$SWAPFILE" bs=1M count="$SIZE_MB"
  chmod 600 "$SWAPFILE"
  mkswap "$SWAPFILE"
fi

swapon "$SWAPFILE"

if ! grep -qF "$SWAPFILE none swap sw 0 0" /etc/fstab; then
  echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
fi

echo "Swap enabled: $SWAPFILE (${SIZE_MB}MB)"
