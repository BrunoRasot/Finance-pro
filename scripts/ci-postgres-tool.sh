#!/usr/bin/env bash
set -euo pipefail
tool="$(basename "$0")"
case "$tool" in pg_dump|pg_restore) ;; *) exit 2 ;; esac
exec docker run --rm --network host \
  --user "$(id -u):$(id -g)" \
  -e PGHOST -e PGPORT -e PGUSER -e PGPASSWORD -e PGDATABASE \
  -e PGCONNECT_TIMEOUT -e PGSSLMODE \
  --volume "${GITHUB_WORKSPACE}:${GITHUB_WORKSPACE}" \
  --workdir "$PWD" postgres:17 "$tool" "$@"
