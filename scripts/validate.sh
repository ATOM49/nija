#!/usr/bin/env bash
# validate.sh — verify the nija project is in a healthy state
# Usage: ./scripts/validate.sh [--fix]
#
# Flags:
#   --fix   auto-fix lint issues where possible (runs eslint --fix + prettier --write)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ─── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}${BOLD}[validate]${NC} $*"; }
success() { echo -e "${GREEN}✔${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✖${NC}  $*" >&2; }

FAILURES=()

run_step() {
  local label="$1"
  shift
  info "${label}..."
  if "$@"; then
    success "$label passed."
  else
    error "$label FAILED."
    FAILURES+=("$label")
  fi
  echo ""
}

# ─── Flag parsing ──────────────────────────────────────────────────────────────
FIX=false
for arg in "$@"; do
  case $arg in
    --fix) FIX=true ;;
    *) warn "Unknown flag: $arg" ;;
  esac
done

echo -e "${BOLD}Running nija project validation checks…${NC}"
echo ""

# ─── Step 1: Dependency check ─────────────────────────────────────────────────
run_step "Dependency installation check" pnpm install --frozen-lockfile

# ─── Step 2: Lint ─────────────────────────────────────────────────────────────
if [ "$FIX" = true ]; then
  run_step "Lint (auto-fix)" bash -c "
    pnpm lint
    pnpm format
  "
else
  run_step "Lint" pnpm lint
fi

# ─── Step 3: Format check ─────────────────────────────────────────────────────
if [ "$FIX" = false ]; then
  run_step "Format check" pnpm prettier --check "**/*.{ts,tsx,js,jsx,json,md}" \
    --ignore-path .gitignore
fi

# ─── Step 4: TypeScript — build (type check + compile) ────────────────────────
run_step "TypeScript build" pnpm build

# ─── Step 5: Tests ────────────────────────────────────────────────────────────
run_step "Unit tests" pnpm test

# ─── Step 6: Security — check for secrets in .env ─────────────────────────────
info "Checking for accidentally committed .env…"
if git ls-files --error-unmatch .env &>/dev/null 2>&1; then
  error ".env is tracked by git! Run: git rm --cached .env"
  FAILURES+=("Secret check (.env tracked by git)")
else
  success ".env is NOT tracked by git."
fi
echo ""

# ─── Summary ──────────────────────────────────────────────────────────────────
if [ ${#FAILURES[@]} -eq 0 ]; then
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}${BOLD}  ✅  All validation checks passed!${NC}"
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 0
else
  echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}${BOLD}  ❌  ${#FAILURES[@]} check(s) failed:${NC}"
  for f in "${FAILURES[@]}"; do
    echo -e "     ${RED}•${NC} $f"
  done
  echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 1
fi
