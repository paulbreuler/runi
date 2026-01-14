#!/bin/bash
# TypeScript Quality Hook - Auto-fix on file write
# Runs type checking, ESLint, and Prettier on TypeScript/Svelte files

FILE_PATH="$1"

# Skip test files (they're checked separately in CI)
if [[ "$FILE_PATH" == *".test.ts" ]] || [[ "$FILE_PATH" == *".test.svelte" ]]; then
    exit 0
fi

# Skip if file doesn't exist (might be deleted)
if [[ ! -f "$FILE_PATH" ]]; then
    exit 0
fi

# Change to project root
cd "$(git rev-parse --show-toplevel)" || exit 0

# Run Prettier formatting (silent, auto-fix)
npm run format -- "$FILE_PATH" > /dev/null 2>&1

# Run ESLint auto-fix (silent)
npm run lint -- --fix "$FILE_PATH" > /dev/null 2>&1

# Type check (non-blocking, just for feedback)
# Note: This is fast but we don't block on it
npm run check -- --noEmit "$FILE_PATH" > /dev/null 2>&1 || true

exit 0
