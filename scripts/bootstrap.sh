#!/usr/bin/env bash
# bootstrap.sh — one-shot project setup for nija (TruthLens/ForwardCheck)
# Usage: ./scripts/bootstrap.sh [--skip-infra] [--skip-install]
#
# Flags:
#   --skip-infra     skip docker-compose up (useful when infra is already running)
#   --skip-install   skip pnpm install (useful in CI with a warm cache)

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

info()    { echo -e "${CYAN}${BOLD}[bootstrap]${NC} $*"; }
success() { echo -e "${GREEN}✔${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✖${NC}  $*" >&2; }
die()     { error "$*"; exit 1; }

# ─── Flag parsing ──────────────────────────────────────────────────────────────
SKIP_INFRA=false
SKIP_INSTALL=false
for arg in "$@"; do
  case $arg in
    --skip-infra)    SKIP_INFRA=true ;;
    --skip-install)  SKIP_INSTALL=true ;;
    *) warn "Unknown flag: $arg" ;;
  esac
done

# ─── Step 1: Prerequisite checks ──────────────────────────────────────────────
info "Checking prerequisites…"

check_tool() {
  local tool="$1"
  local min_version="$2"
  local install_hint="$3"
  if ! command -v "$tool" &>/dev/null; then
    die "$tool is not installed. $install_hint"
  fi
  success "$tool found: $(${tool} --version 2>&1 | head -1)"
}

check_tool "node"   "20" "Install from https://nodejs.org (v20+)"
check_tool "pnpm"   "9"  "Run: npm install -g pnpm@9"
check_tool "docker" ""   "Install from https://docs.docker.com/get-docker/"

# Verify Node major version >= 20
NODE_MAJOR=$(node -e "process.stdout.write(process.version.replace('v','').split('.')[0])")
if [ "$NODE_MAJOR" -lt 20 ]; then
  die "Node.js v20+ is required (found v${NODE_MAJOR})."
fi

# Verify pnpm major version >= 9
PNPM_MAJOR=$(pnpm --version | cut -d. -f1)
if [ "$PNPM_MAJOR" -lt 9 ]; then
  die "pnpm v9+ is required (found v$(pnpm --version))."
fi

success "All prerequisites satisfied."
echo ""

# ─── Step 2: Environment file ─────────────────────────────────────────────────
info "Setting up environment file…"

if [ -f ".env" ]; then
  warn ".env already exists — skipping copy. Review .env.example for any new variables."
else
  cp .env.example .env
  success "Copied .env.example → .env"
  warn "Open .env and fill in your API keys before starting the API server."
fi
echo ""

# ─── Step 3: Install dependencies ─────────────────────────────────────────────
if [ "$SKIP_INSTALL" = false ]; then
  info "Installing dependencies with pnpm…"
  pnpm install --frozen-lockfile
  success "Dependencies installed."
  echo ""
fi

# ─── Step 4: Start infrastructure ─────────────────────────────────────────────
if [ "$SKIP_INFRA" = false ]; then
  info "Starting infrastructure services (postgres + redis) via docker-compose…"

  if ! docker info &>/dev/null; then
    die "Docker daemon is not running. Start Docker Desktop or the Docker service and retry."
  fi

  docker compose up -d --wait
  success "Infrastructure services started."
  echo ""

  # Give postgres a moment to be truly ready after healthcheck
  info "Waiting for PostgreSQL to accept connections…"
  until docker compose exec -T postgres pg_isready -U postgres &>/dev/null; do
    sleep 1
  done
  success "PostgreSQL is ready."
  echo ""
fi

# ─── Step 5: Database migrations ──────────────────────────────────────────────
info "Running database migrations…"

if [ -f "packages/db/package.json" ]; then
  # Check if DATABASE_URL is set (non-placeholder)
  DB_URL=""
  if [ -f ".env" ]; then
    DB_URL=$(grep -E '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')
  fi

  if [ -z "$DB_URL" ] || [[ "$DB_URL" == *"your-"* ]]; then
    warn "DATABASE_URL is not configured in .env — skipping migrations."
    warn "Run 'pnpm --filter @nija/db db:migrate' manually after setting DATABASE_URL."
  else
    pnpm --filter @nija/db db:migrate
    success "Database migrations applied."
  fi
else
  warn "packages/db not found — skipping migrations."
fi
echo ""

# ─── Step 6: Build packages ────────────────────────────────────────────────────
info "Building packages (typecheck + compile)…"
pnpm build
success "All packages built successfully."
echo ""

# ─── Done ─────────────────────────────────────────────────────────────────────
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  🎉  nija is ready to develop!${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Start the API server:   ${CYAN}pnpm --filter @nija/api dev${NC}"
echo -e "  Start the workers:      ${CYAN}pnpm --filter @nija/workers dev${NC}"
echo -e "  Start the web app:      ${CYAN}pnpm --filter @nija/web dev${NC}"
echo -e "  Start all (dev mode):   ${CYAN}pnpm dev${NC}"
echo -e "  Run validate script:    ${CYAN}pnpm validate${NC}"
echo ""
echo -e "  API docs (when running): ${CYAN}http://localhost:3001/docs${NC}"
echo -e "  Admin console:           ${CYAN}http://localhost:3002${NC}"
echo ""
