#!/bin/bash
# Measure startup time of the release bundle
# Usage: just measure-startup
# This script is macOS-only: uses 'open' and a .app bundle path

set -e

# Verify we are running on macOS (Darwin)
if [ "$(uname)" != "Darwin" ]; then
  echo "❌ Error: This script only supports macOS."
  echo "   Detected OS: $(uname)"
  exit 1
fi

APP_PATH="src-tauri/target/release/bundle/macos/Runi.app"
LOG_FILE=".tmp/startup-timing.log"

# Create .tmp directory if it doesn't exist
mkdir -p .tmp

echo "🔍 Measuring startup time for release bundle..."
echo ""

if [ ! -d "$APP_PATH" ]; then
  echo "❌ Error: Release bundle not found at $APP_PATH"
  echo "   Please run 'just build' first"
  exit 1
fi

# Close any existing Runi instances
killall Runi 2>/dev/null || true
sleep 0.5

# Launch the app and measure time
echo "⏱️  Launching app and measuring startup time..."
START_TIME=$(date +%s.%N)

open "$APP_PATH"

# Wait for app to start (check for process)
MAX_WAIT=10
WAITED=0
while ! pgrep -f "Runi.app" > /dev/null && [ $WAITED -lt $MAX_WAIT ]; do
  sleep 0.1
  WAITED=$(awk "BEGIN {print $WAITED + 0.1}")
done

if ! pgrep -f "Runi.app" > /dev/null; then
  echo "❌ Error: App did not start within ${MAX_WAIT}s"
  exit 1
fi

# Wait a bit more for app to fully render
sleep 1.5

# Get process start time from system (more accurate)
PROCESS_START=$(ps -o lstart= -p $(pgrep -f "Runi.app" | head -1) 2>/dev/null || echo "")

END_TIME=$(date +%s.%N)
ELAPSED=$(awk "BEGIN {print $END_TIME - $START_TIME}")

echo ""
echo "📊 Startup Measurement Results:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Launch to Process Start: ${ELAPSED}s"
echo ""

if [ -n "$PROCESS_START" ]; then
  echo "Process Start Time: $PROCESS_START"
fi

echo ""
echo "💡 Tip: Check browser console (in app) for detailed timing:"
echo "   The app logs startup timing if launched with '?measure-startup'"
echo "   Or in development mode automatically"
echo ""

# Save to log file
{
  echo "Startup Time Measurement - $(date)"
  echo "Launch to Process Start: ${ELAPSED}s"
  if [ -n "$PROCESS_START" ]; then
    echo "Process Start Time: $PROCESS_START"
  fi
  echo ""
} > "$LOG_FILE"

echo "📝 Results saved to: $LOG_FILE"
echo ""
echo "✅ Measurement complete"
echo ""
echo "To get detailed React/DOM timing, check the app console logs"