#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec codex \
  -C "$project_dir" \
  -c 'agents.enabled=true' \
  -c 'agents.max_concurrent_threads_per_session=3' \
  -c 'agents.backend.description="FastAPI, PostgreSQL schema, data integrity and authorization specialist."' \
  -c "agents.backend.config_file=\"$project_dir/codex-agents/backend.toml\"" \
  -c 'agents.frontend.description="Next.js, TypeScript and accessible UI specialist."' \
  -c "agents.frontend.config_file=\"$project_dir/codex-agents/frontend.toml\"" \
  -c 'agents.algorithm.description="Scheduling algorithms, hard constraints and verification specialist."' \
  -c "agents.algorithm.config_file=\"$project_dir/codex-agents/algorithm.toml\"" \
  "$@"
