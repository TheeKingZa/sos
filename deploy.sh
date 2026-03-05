#!/usr/bin/env bash
set -e

# ==============================
# COLORS
# ==============================

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RESET="\033[0m"

function error {
  echo -e "${RED}✖ $1${RESET}"
  exit 1
}

function info {
  echo -e "${YELLOW}→ $1${RESET}"
}

function success {
  echo -e "${GREEN}✔ $1${RESET}"
}

# ==============================
# CHECK GIT REPOSITORY
# ==============================

if ! git rev-parse --git-dir &>/dev/null; then
  error "Not a git repository."
fi

# ==============================
# CHECK BRANCH
# ==============================

CURRENT=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT" != "master" ]; then
  error "Run this script from the master branch. Current: $CURRENT"
fi

# ==============================
# CHECK REMOTE
# ==============================

if ! git remote get-url origin &>/dev/null; then
  error "Remote 'origin' not configured."
fi

# ==============================
# FETCH REMOTE STATE
# ==============================

info "Fetching latest remote changes..."
git fetch origin

# ==============================
# COMMIT MESSAGE
# ==============================

echo -ne "${YELLOW}Enter commit message: ${RESET}"
read -r MSG

if [ -z "$MSG" ]; then
  error "Commit message cannot be empty."
fi

# ==============================
# STAGE FILES
# ==============================

info "Staging changes..."
git add .

# ==============================
# COMMIT IF NEEDED
# ==============================

if git diff --cached --quiet; then
  info "No changes to commit."
else
  info "Committing: \"$MSG\""
  git commit -m "$MSG"
fi

# ==============================
# PUSH MASTER
# ==============================

info "Pushing master → origin/master..."
git push origin master

# ==============================
# SYNC gh-pages
# ==============================

info "Syncing gh-pages with master..."

git push origin master:gh-pages --force-with-lease

# ==============================
# SHOW RESULT
# ==============================

MASTER_HASH=$(git rev-parse master)

success "Deployment complete!"
echo -e "${GREEN}Master commit:${RESET} $MASTER_HASH"
echo -e "${GREEN}gh-pages now matches master.${RESET}"