#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
for name in relay-api relay-client; do
  cd "$root/$name"
  if [ ! -d .git ]; then
    git init -b main
    git add .
    git -c user.name='RelayLab Fixture' -c user.email='fixture@relaylab.invalid' commit -m 'test: initial RelayLab fixture'
    echo "Initialized $name"
  else
    echo "Already initialized: $name"
  fi
done
