#!/usr/bin/env bash
set -e

# ANSI colors
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

# 1) Ensure we're in a git repo
if ! git rev-parse --git-dir &>/dev/null; then
  error "Not a git repository. Run 'git init', add a remote, and make your first commit."
fi

# 2) Ensure we're on master
CURRENT=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT" != "master" ]; then
  error "You must run this from the master branch (current: $CURRENT)."
fi

# 3) Prompt for commit message
echo -ne "${YELLOW}Enter commit message: ${RESET}"
read -r MSG
if [ -z "$MSG" ]; then
  error "Commit message cannot be empty."
fi

# 4) Stage all changes
info "Staging changes..."
git add .

# 5) Commit if there are staged changes
if git diff --cached --quiet; then
  info "No changes to commit."
else
  info "Committing: \"$MSG\""
  git commit -m "$MSG" || error "Commit failed."
fi

# 6) Push master → origin/master
info "Pushing master → origin/master..."
git push origin master || error "Failed to push to origin/master."

# 7) Push master → origin/gh-pages (force)
info "Updating origin/gh-pages from master..."
if git ls-remote --exit-code --heads origin gh-pages &>/dev/null; then
  git push origin master:gh-pages --force || error "Failed to update gh-pages."
else
  git push origin master:gh-pages || error "Failed to create gh-pages."
fi

success "Deployment complete!"