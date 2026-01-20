#!/usr/bin/env bash
# Check if only documentation files have changed in the current commit/branch

set -e

# Get the list of changed files
# For pre-push hook, we compare against the remote branch
# For pre-commit, we compare against HEAD
if [ -n "$1" ]; then
  # If branch name provided, compare against remote
  REMOTE_REF="$1"
  CHANGED_FILES=$(git diff --name-only "$REMOTE_REF" HEAD 2>/dev/null || git diff --name-only origin/"$REMOTE_REF" HEAD 2>/dev/null || echo "")
else
  # Default: compare against remote tracking branch or origin/main
  REMOTE_REF=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "origin/main")
  CHANGED_FILES=$(git diff --name-only "$REMOTE_REF" HEAD 2>/dev/null || echo "")
fi

# If no changes detected, assume code changes (safer default)
if [ -z "$CHANGED_FILES" ]; then
  echo "false"
  exit 0
fi

# Documentation file patterns
DOC_PATTERNS=(
  "*.md"
  "*.MD"
  "*.txt"
  "*.TXT"
  "docs/**"
  ".claude/**"
  ".cursor/**"
  "*.mdx"
  "*.MDX"
  "README*"
  "readme*"
  "CHANGELOG*"
  "changelog*"
  "LICENSE*"
  "license*"
  "CONTRIBUTING*"
  "contributing*"
  ".github/**/*.md"
  ".github/**/*.yml"
  ".github/**/*.yaml"
)

# Check if all changed files match documentation patterns
ALL_DOCS=true
while IFS= read -r file; do
  if [ -z "$file" ]; then
    continue
  fi
  
  IS_DOC=false
  for pattern in "${DOC_PATTERNS[@]}"; do
    # Use shell glob matching
    case "$file" in
      $pattern)
        IS_DOC=true
        break
        ;;
    esac
  done
  
  if [ "$IS_DOC" = false ]; then
    ALL_DOCS=false
    break
  fi
done <<< "$CHANGED_FILES"

if [ "$ALL_DOCS" = true ]; then
  echo "true"
else
  echo "false"
fi
