#!/usr/bin/env bash

set -euo pipefail
set +x
umask 077

if [[ -n "${OPENAI_API_KEY:-}" || -n "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "API-key authentication is prohibited for this subscription-only harness." >&2
  exit 78
fi

: "${CODEX_AUTH_JSON_GZIP_B64:?Missing encrypted Codex subscription credential bundle}"
: "${CLAUDE_CODE_OAUTH_TOKEN:?Missing encrypted Claude subscription token}"

runtime_root="${XDG_RUNTIME_DIR:-${TMPDIR:-/tmp}}/dev-agent-os-$(id -u)"
claude_token_file="$runtime_root/claude-oauth-token"
claude_status="$(mktemp "${TMPDIR:-/tmp}/claude-auth-status.XXXXXX")"

if [[ "${AI_OS_AUTH_TEST_MODE:-0}" == "1" ]]; then
  : "${AI_OS_AUTH_BIN_DIR:?Test mode requires AI_OS_AUTH_BIN_DIR}"
  auth_bin_dir="$AI_OS_AUTH_BIN_DIR"
else
  if [[ -n "${AI_OS_AUTH_BIN_DIR:-}" ]]; then
    echo "AI_OS_AUTH_BIN_DIR is allowed only in explicit test mode." >&2
    exit 78
  fi
  auth_bin_dir="/usr/local/bin"
fi

cleanup() {
  rm -f "${codex_candidate:-}" "$claude_status"
}
trap cleanup EXIT

install -d -m 700 "$HOME/.codex" "$runtime_root" "$auth_bin_dir"
codex_candidate="$(mktemp "$HOME/.codex/auth.json.candidate.XXXXXX")"
printf '%s' "$CODEX_AUTH_JSON_GZIP_B64" \
  | base64 --decode \
  | gzip --decompress \
  > "$codex_candidate"

node - "$codex_candidate" <<'NODE'
const fs = require("node:fs");
const file = process.argv[2];
const auth = JSON.parse(fs.readFileSync(file, "utf8"));
const tokens = auth.tokens ?? {};
if (auth.auth_mode !== "chatgpt" || auth.OPENAI_API_KEY) process.exit(1);
for (const key of ["access_token", "refresh_token", "id_token", "account_id"]) {
  if (typeof tokens[key] !== "string" || tokens[key].length === 0) process.exit(1);
}
NODE

chmod 600 "$codex_candidate"
mv -f "$codex_candidate" "$HOME/.codex/auth.json"
codex_candidate=""

printf '%s' "$CLAUDE_CODE_OAUTH_TOKEN" > "$claude_token_file"
chmod 600 "$claude_token_file"
claude_real_js="$(npm root -g)/@anthropic-ai/claude-code/cli.js"
test -f "$claude_real_js"

{
  printf '%s\n' '#!/usr/bin/env bash' 'set -euo pipefail' 'set +x'
  printf 'CLAUDE_REAL_JS=%q\n' "$claude_real_js"
  printf 'TOKEN_FILE=%q\n' "$claude_token_file"
  printf '%s\n' \
    'test -s "$TOKEN_FILE"' \
    'test -f "$CLAUDE_REAL_JS"' \
    'export CLAUDE_CODE_OAUTH_TOKEN="$(<"$TOKEN_FILE")"' \
    'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1' \
    'export DISABLE_TELEMETRY=1' \
    'export DISABLE_ERROR_REPORTING=1' \
    'export DISABLE_BUG_COMMAND=1' \
    'exec node "$CLAUDE_REAL_JS" "$@"'
} > "$auth_bin_dir/claude"
chmod 700 "$auth_bin_dir/claude"

codex login status >/dev/null 2>&1
"$auth_bin_dir/claude" auth status --json > "$claude_status"
node - "$claude_status" <<'NODE'
const fs = require("node:fs");
const status = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (status.loggedIn !== true || status.authMethod !== "claude.ai") process.exit(1);
if (!new Set(["pro", "max"]).has(status.subscriptionType)) process.exit(1);
NODE

echo "Subscription authentication ready for Codex and Claude Code."
