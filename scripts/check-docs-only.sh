#!/usr/bin/env bash
# Check if only documentation files have changed in the current commit/branch

set -e

# Get the list of changed files
# For pre-push hook: Git provides remote name and URL as $1 and $2
# We need to compare local refs that are being pushed
# For other contexts, compare against provided ref or default

# Try to get the remote tracking branch
REMOTE_REF=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")

if [ -n "$REMOTE_REF" ]; then
  # Compare against remote tracking branch
  CHANGED_FILES=$(git diff --name-only "$REMOTE_REF" HEAD 2>/dev/null || echo "")
elif [ -n "$1" ] && git rev-parse --verify "$1" >/dev/null 2>&1; then
  # If a ref is provided and exists, use it
  CHANGED_FILES=$(git diff --name-only "$1" HEAD 2>/dev/null || echo "")
else
  # Fallback: compare against origin/main or main
  for ref in "origin/main" "origin/master" "main" "master"; do
    if git rev-parse --verify "$ref" >/dev/null 2>&1; then
      CHANGED_FILES=$(git diff --name-only "$ref" HEAD 2>/dev/null || echo "")
      break
    fi
  done
fi

# If still no changes detected, assume code changes (safer default)
if [ -z "$CHANGED_FILES" ]; then
  echo "false"
  exit 0
fi

# Check if all changed files match documentation patterns
ALL_DOCS=true
while IFS= read -r file; do
  if [ -z "$file" ]; then
    continue
  fi
  
  IS_DOC=false
  
  # Check file extension patterns
  case "$file" in
    *.md|*.MD|*.mdx|*.MDX|*.txt|*.TXT)
      IS_DOC=true
      ;;
    README*|readme*|CHANGELOG*|changelog*|LICENSE*|license*|CONTRIBUTING*|contributing*)
      IS_DOC=true
      ;;
    docs/*|.claude/*|.cursor/*)
      IS_DOC=true
      ;;
    .github/*.md|.github/*.yml|.github/*.yaml)
      IS_DOC=true
      ;;
    *)
      # Check if file is in a documentation directory
      if [[ "$file" == docs/* ]] || \
         [[ "$file" == .claude/* ]] || \
         [[ "$file" == .cursor/* ]] || \
         [[ "$file" == .github/*.md ]] || \
         [[ "$file" == .github/*.yml ]] || \
         [[ "$file" == .github/*.yaml ]]; then
        IS_DOC=true
      fi
      ;;
  esac
  
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
