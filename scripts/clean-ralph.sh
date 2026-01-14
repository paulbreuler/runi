#!/bin/bash
# Remove all ralph session files and reset circuit breaker
# Extracted from justfile for use as standalone script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🧹 Cleaning Ralph session files..."

rm -f .call_count
rm -f .circuit_breaker_history
rm -f .circuit_breaker_state
rm -f .claude_session_id
rm -f .exit_signals
rm -f .last_reset
rm -f .ralph_session
rm -f .ralph_session_history
rm -f .response_analysis
rm -f progress.json
rm -f status.json

# Try to reset circuit breaker (may fail if ralph not installed, that's OK)
ralph --reset-circuit 2>/dev/null || true

echo "✅ All ralph session files removed and circuit breaker reset"
