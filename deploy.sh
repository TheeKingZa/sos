#!/bin/bash
# ==================================================
# deploy-master-gh-pages.sh
# --------------------------------------------------
# Purpose:
# - Push changes to master and gh-pages
# - Ensure gh-pages always mirrors master
# - Ensure master is default branch
# - Show error messages, current branch, and live URL
# - Auto-update footer year
# ==================================================

# -----------------------------
# Color definitions
# -----------------------------
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m"

# -----------------------------
# Helper functions
# -----------------------------
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# -----------------------------
# Safety checks
# -----------------------------
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  log_error "This directory is not a git repository."
fi

MASTER_BRANCH="master"
GH_PAGES_BRANCH="gh-pages"

# Ensure branches exist
for branch in $MASTER_BRANCH $GH_PAGES_BRANCH; do
  if ! git show-ref --verify --quiet refs/heads/$branch; then
    log_warn "$branch branch not found. Creating..."
    git checkout -b $branch || log_error "Failed to create $branch branch."
    git push -u origin $branch || log_error "Failed to push $branch branch."
  fi
done

# Show current branch
CURRENT_BRANCH=$(git branch --show-current)
log_info "Current branch: $CURRENT_BRANCH"

# Ensure clean working tree
if ! git diff --quiet || ! git diff --cached --quiet; then
  log_warn "Uncommitted changes detected. Staging and committing..."
  git add .
  read -p "Enter commit message (default: Update site): " COMMIT_MSG
  COMMIT_MSG=${COMMIT_MSG:-"Update site"}
  git commit -m "$COMMIT_MSG" || log_info "No changes to commit."
fi

# -----------------------------
# Push master
# -----------------------------
log_info "Switching to master branch..."
git checkout $MASTER_BRANCH || log_error "Failed to switch to master."

log_info "Pulling latest master..."
git pull origin $MASTER_BRANCH || log_error "Failed to pull master."

log_info "Pushing master to origin..."
git push origin $MASTER_BRANCH || log_error "Failed to push master."

# -----------------------------
# Sync gh-pages to master
# -----------------------------
log_info "Switching to gh-pages branch..."
git checkout $GH_PAGES_BRANCH || log_error "Failed to switch to gh-pages."

log_info "Resetting gh-pages to match master..."
git reset --hard $MASTER_BRANCH || log_error "Failed to reset gh-pages."

log_info "Pushing gh-pages to origin..."
git push origin $GH_PAGES_BRANCH --force || log_error "Failed to push gh-pages."

# -----------------------------
# Auto-update footer year
# -----------------------------
for file in index.html gallery.html contact.html; do
  if [ -f "$file" ]; then
    sed -i "s/© [0-9]\{4\}/© $(date +%Y)/" "$file"
  fi
done

# Return to master
git checkout $MASTER_BRANCH || log_warn "Could not switch back to master."

# -----------------------------
# Display live GitHub Pages URL
# -----------------------------
ORIGIN_URL=$(git config --get remote.origin.url)
CLEAN_URL=$(echo "$ORIGIN_URL" | sed -E 's#(https://|git@)##; s#.*github.com[:/]##; s#\.git$##')
GITHUB_USER=$(echo "$CLEAN_URL" | cut -d'/' -f1)
REPO_NAME=$(echo "$CLEAN_URL" | cut -d'/' -f2)

if [ -n "$GITHUB_USER" ] && [ -n "$REPO_NAME" ]; then
  LIVE_URL="https://${GITHUB_USER}.github.io/${REPO_NAME}/"
  log_success "Deployment complete!"
  log_info "Your site is live at:"
  echo -e "${GREEN}${LIVE_URL}${NC}"
else
  log_warn "Could not detect live URL. Check GitHub Pages settings."
fi

# -----------------------------
# End of deploy-master-gh-pages.sh
# -----------------------------
