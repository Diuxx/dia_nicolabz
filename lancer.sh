#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
npm run dev
