#!/usr/bin/env bash
set -euo pipefail

# --- paths ---
OPENAPI_IN="./../../../openapi/latest.json"
CLIENT_OUT="../src/api-client/"   # if .ts -> we'll use its directory

# Exclude tags (CSV)
EXCLUDE_TAGS_CSV="${EXCLUDE_TAGS_CSV:-internal}"

# --- checks ---
command -v jq >/dev/null 2>&1 || { echo "ERROR: 'jq' is required." >&2; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "ERROR: 'npx' is required." >&2; exit 1; }
[[ -f "${OPENAPI_IN}" ]] || { echo "ERROR: OpenAPI spec not found at ${OPENAPI_IN}" >&2; exit 1; }

# --- temp ---
TMP_JSON="$(mktemp 2>/dev/null || mktemp -t oasfiltered)"
TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t oashey)"
cleanup() { rm -rf "${TMP_JSON}" "${TMP_DIR}" || true; }
trap cleanup EXIT

# CSV -> JSON array
EXCLUDE_JQ_ARRAY="$(printf '%s' "${EXCLUDE_TAGS_CSV}" | awk -F',' '{
  printf("["); for (i=1; i<=NF; i++) { gsub(/^[ \t]+|[ \t]+$/, "", $i); printf("%s\"%s\"", (i>1?",":""), $i); } printf("]");
}')"

# Filter spec
jq --argjson EXCLUDE_TAGS "${EXCLUDE_JQ_ARRAY}" '
  def is_excluded_op(op):
    ((op."x-internal" // false) == true) or
    ((op.tags // []) | any(. as $t | $EXCLUDE_TAGS | index($t)));
  .paths |= with_entries(
    .value |= (to_entries
      | map(if (.key | IN("get","put","post","delete","patch","options","head","trace"))
              then (if is_excluded_op(.value) then empty else . end)
              else . end)
      | from_entries)
  )
  | .paths |= with_entries(
      select((.value | keys
        | map(select(IN("get","put","post","delete","patch","options","head","trace")))
        | length) > 0)
    )
  | .tags |= ((. // []) | map(select((.name as $n | ($EXCLUDE_TAGS | index($n)) | not))))
' "${OPENAPI_IN}" > "${TMP_JSON}"

# Resolve output dir from CLIENT_OUT and make ABS path
if [[ "${CLIENT_OUT##*.}" == "ts" ]]; then
  OUTPUT_DIR="$(dirname "${CLIENT_OUT}")"
else
  OUTPUT_DIR="${CLIENT_OUT}"
fi
mkdir -p "${OUTPUT_DIR}"
pushd "${OUTPUT_DIR}" >/dev/null
OUTPUT_DIR_ABS="$(pwd -P)"
popd >/dev/null


# --- transient Hey API config in TMP_DIR ---
CONFIG_FILE="${TMP_DIR}/openapi-ts.config.mjs"
cat > "${CONFIG_FILE}" <<EOF
/** @type {import('@hey-api/openapi-ts').UserConfig} */
export default {
  input: ${TMP_JSON@Q},
  output: ${OUTPUT_DIR_ABS@Q},
  plugins: [
    // Next.js client (fetch wrapper for Next) + runtime config hook
    { name: '@hey-api/client-next', runtimeConfigPath: './heyapi.runtime.ts' },
    // TanStack Query helpers (queryOptions / infinite / keys)
    { name: '@tanstack/react-query', queryOptions: true, infiniteQueryOptions: true, queryKeys: { tags: true } }
  ]
};
EOF

# Run CLI inside TMP_DIR so it auto-loads config; output uses ABS path
pushd "${TMP_DIR}" >/dev/null
npx @hey-api/openapi-ts
popd >/dev/null

echo "✅ Hey API Next.js client generated in: ${OUTPUT_DIR_ABS}"
echo "   Files: client.gen.ts, sdk.gen.ts, types.gen.ts, tanstack helpers, heyapi.runtime.ts"

# --- Next.js runtime config for the generated client (imported by client.gen.ts) ---
RUNTIME_FILE="${OUTPUT_DIR_ABS}/heyapi.runtime.ts"
if [[ ! -f "${RUNTIME_FILE}" ]]; then
  cat > "${RUNTIME_FILE}" <<'TS'
/**
 * Runtime config for Hey API Next.js client.
 * Used by client.gen.ts at runtime (both server & client).
 * Avoid server-only imports here.
 */
import type { CreateClientConfig } from './client.gen';

let currentToken: string | undefined;
export function setHeyApiAuthToken(token?: string) {
  currentToken = token;
}

export const createClientConfig: CreateClientConfig = (config) => {
  const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.API_BASE_URL ??
      '';

  return {
    ...config,
    baseUrl,
    // Hey API attaches this token only to endpoints that require auth
    // (you can also override later via client.setConfig).
    auth: () => currentToken,
  };
};

TS
fi