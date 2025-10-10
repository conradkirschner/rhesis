#!/usr/bin/env bash
set -euo pipefail

# Config
APP_DIR="./apps/backend/src/rhesis/backend/app"
EXPORT_SCRIPT="apps/backend/export-api-specs.py"
OUT_DIR="./openapi"
VENV_DIR="apps/backend/.venv"

# Ensure we're at repo root
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

# Make sure tags are available (no-op if already local)
git fetch --tags --force >/dev/null 2>&1 || true

# Find latest tag 'backend-*' by version
LATEST_TAG="$(git tag -l 'backend-*' --sort=-v:refname | head -n1 || true)"
if [[ -n "${LATEST_TAG}" ]]; then
  VERSION="${LATEST_TAG#backend-}"
else
  # Fallback: try Python package version, else dummy
  VERSION="$(python3 - <<'PY' 2>/dev/null || true
try:
    import rhesis.backend as m
    print(m.__version__)
except Exception:
    pass
PY
)"
  [[ -z "${VERSION}" ]] && VERSION="0.0.0"
fi

mkdir -p "${OUT_DIR}"

# Python venv + install
if [[ ! -d "${VENV_DIR}" ]]; then
  python3 -m venv "${VENV_DIR}"
fi
# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"
python3 -m pip -q install --upgrade pip
python3 -m pip install ./apps/backend/.

# Export to temp, then atomically move
TMP_FILE="${OUT_DIR}/spec.tmp.json"
VERSIONED_FILE="${OUT_DIR}/backend-${VERSION}.json"
LATEST_FILE="${OUT_DIR}/latest.json"

NO_DATABASE=true python3 "${EXPORT_SCRIPT}" \
  --app-dir "${APP_DIR}" \
  --out "${TMP_FILE}" \
  main:app

mv -f "${TMP_FILE}" "${VERSIONED_FILE}"

# Update "latest" (prefer symlink, fallback to copy)
(
  cd "${OUT_DIR}"
  ln -sfn "$(basename "${VERSIONED_FILE}")" "latest.json" 2>/dev/null || cp -f "$(basename "${VERSIONED_FILE}")" "latest.json"
)

echo "OpenAPI exported:"
echo "  ${VERSIONED_FILE}"
if [[ -L "${LATEST_FILE}" ]]; then
  echo "  ${LATEST_FILE} -> $(readlink "${LATEST_FILE}")"
else
  echo "  ${LATEST_FILE}"
fi
