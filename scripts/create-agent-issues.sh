#!/usr/bin/env bash
# CLI Agent: Create GitHub issues for agent work
# Runs independently to avoid polluting primary agent conversation
# Reports results to a log file that can be checked separately

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source functions from run-agent.sh
# We need to prevent main() from executing, so we'll set a flag
export _SOURCING_AGENT_FUNCTIONS=true
set +e
source "$SCRIPT_DIR/run-agent.sh" 2>/dev/null || {
    echo "Error: Could not source run-agent.sh functions" >&2
    exit 1
}
set -e
unset _SOURCING_AGENT_FUNCTIONS

# Verify required functions exist
if ! declare -f extract_issue_number >/dev/null 2>&1; then
    echo "Error: Required functions not available. Please ensure run-agent.sh is accessible." >&2
    exit 1
fi

# ANSI color codes
RESET='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'

# Function to get absolute path
get_absolute_path() {
    local path="$1"
    if [[ "$path" == /* ]]; then
        echo "$path"
    elif command -v realpath >/dev/null 2>&1; then
        realpath "$path" 2>/dev/null || echo "$path"
    else
        local dir
        dir=$(cd "$(dirname "$path")" 2>/dev/null && pwd)
        if [ -n "$dir" ]; then
            echo "$dir/$(basename "$path")"
        else
            echo "$path"
        fi
    fi
}

# Main execution
main() {
    local agent_file="$1"
    local log_file="${2:-}"
    
    # Resolve absolute path
    agent_file=$(get_absolute_path "$agent_file")
    
    if [ ! -f "$agent_file" ]; then
        echo "❌ Agent file not found: $agent_file" >&2
        exit 1
    fi
    
    # Check if GitHub issue already exists
    local existing_issue=$(extract_issue_number "$agent_file" 2>/dev/null || echo "")
    if [ -n "$existing_issue" ]; then
        if [ -n "$log_file" ]; then
            echo "✅ GitHub issue #${existing_issue} already exists for agent" >> "$log_file"
        else
            echo "✅ GitHub issue #${existing_issue} already exists"
        fi
        exit 0
    fi
    
    # Extract agent metadata
    local metadata=$(extract_agent_metadata "$agent_file")
    IFS='|' read -r agent_display_name agent_num plan_name feature_numbers feature_names feature_tldrs feature_files <<< "$metadata"
    
    # Create log file if provided
    if [ -n "$log_file" ]; then
        echo "🚀 Creating GitHub issues for agent: ${agent_display_name}" >> "$log_file"
        echo "   Agent file: ${agent_file}" >> "$log_file"
        echo "" >> "$log_file"
    fi
    
    # Create agent issue (parent)
    local agent_issue_number
    agent_issue_number=$(create_agent_issue "$agent_file" "$agent_display_name" "$agent_num" "$plan_name" "$feature_numbers" "$feature_tldrs" "" 2>&1)
    
    if [ $? -ne 0 ] || [ -z "$agent_issue_number" ]; then
        local error_msg="❌ Failed to create agent issue"
        if [ -n "$log_file" ]; then
            echo "$error_msg" >> "$log_file"
            echo "$agent_issue_number" >> "$log_file"
        else
            echo "$error_msg" >&2
            echo "$agent_issue_number" >&2
        fi
        exit 1
    fi
    
    if [ -n "$log_file" ]; then
        echo "✅ Created agent issue #${agent_issue_number}" >> "$log_file"
    else
        echo "✅ Created agent issue #${agent_issue_number}"
    fi
    
    # Create feature subissues
    local feature_subissues=""
    IFS=',' read -ra FEATURE_NUM_ARRAY <<< "$feature_numbers"
    IFS='|' read -ra FEATURE_NAME_ARRAY <<< "$feature_names"
    IFS='|' read -ra FEATURE_TLDR_ARRAY <<< "$feature_tldrs"
    IFS='|' read -ra FEATURE_FILES_ARRAY <<< "$feature_files"
    
    for i in "${!FEATURE_NUM_ARRAY[@]}"; do
        local feature_num="${FEATURE_NUM_ARRAY[$i]}"
        local feature_name=""
        local feature_tldr=""
        local feature_files_for_subissue=""
        
        # Find feature name
        for name_entry in "${FEATURE_NAME_ARRAY[@]}"; do
            if [[ "$name_entry" =~ ^${feature_num}:(.*)$ ]]; then
                feature_name="${BASH_REMATCH[1]}"
                break
            fi
        done
        
        # Find feature TL;DR
        for tldr_entry in "${FEATURE_TLDR_ARRAY[@]}"; do
            if [[ "$tldr_entry" =~ ^${feature_num}:(.*)$ ]]; then
                feature_tldr="${BASH_REMATCH[1]}"
                break
            fi
        done
        
        # Find feature files
        for files_entry in "${FEATURE_FILES_ARRAY[@]}"; do
            if [[ "$files_entry" =~ ^${feature_num}:(.*)$ ]]; then
                feature_files_for_subissue="${BASH_REMATCH[1]}"
                break
            fi
        done
        
        # Create subissue
        local subissue_number
        subissue_number=$(create_feature_subissue "$agent_issue_number" "$feature_num" "$feature_name" "$feature_tldr" "$feature_files_for_subissue" "$agent_issue_number" "$agent_display_name" "$plan_name" 2>&1)
        
        if [ $? -eq 0 ] && [ -n "$subissue_number" ]; then
            if [ -n "$log_file" ]; then
                echo "  ✅ Created feature #${feature_num} subissue #${subissue_number}" >> "$log_file"
            else
                echo "  ✅ Created feature #${feature_num} subissue #${subissue_number}"
            fi
            feature_subissues="${feature_subissues}${feature_subissues:+|}${feature_num}:${subissue_number}"
        else
            if [ -n "$log_file" ]; then
                echo "  ⚠️  Failed to create feature #${feature_num} subissue" >> "$log_file"
            else
                echo "  ⚠️  Failed to create feature #${feature_num} subissue" >&2
            fi
        fi
    done
    
    # Update agent issue body with subissue links
    if [ -n "$feature_subissues" ]; then
        local subissue_list=""
        IFS='|' read -ra SUBISSUE_ARRAY <<< "$feature_subissues"
        for subissue_entry in "${SUBISSUE_ARRAY[@]}"; do
            if [[ "$subissue_entry" =~ ^([0-9]+):([0-9]+)$ ]]; then
                local feature_num="${BASH_REMATCH[1]}"
                local subissue_num="${BASH_REMATCH[2]}"
                local feature_name_for_list=""
                for name_entry in "${FEATURE_NAME_ARRAY[@]}"; do
                    if [[ "$name_entry" =~ ^${feature_num}:(.*)$ ]]; then
                        feature_name_for_list="${BASH_REMATCH[1]}"
                        break
                    fi
                done
                subissue_list="${subissue_list}
- #${subissue_num} - Feature #${feature_num}: ${feature_name_for_list}"
            fi
        done
        
        # Update agent issue body
        local repo_info=$(gh repo view --json owner,name 2>/dev/null || echo "")
        if [ -n "$repo_info" ] && command -v jq >/dev/null 2>&1; then
            local repo_owner=$(echo "$repo_info" | jq -r '.owner.login' 2>/dev/null || echo "")
            local repo_name=$(echo "$repo_info" | jq -r '.name' 2>/dev/null || echo "")
            if [ -n "$repo_owner" ] && [ -n "$repo_name" ]; then
                local current_body=$(gh issue view "$agent_issue_number" --json body -q '.body' --repo "${repo_owner}/${repo_name}" 2>/dev/null || echo "")
                if [ -n "$current_body" ]; then
                    local updated_body=$(echo "$current_body" | sed "s/_Feature subissues will be created and linked here._/${subissue_list}/")
                    gh issue edit "$agent_issue_number" --body "$updated_body" --repo "${repo_owner}/${repo_name}" >/dev/null 2>&1 || true
                fi
            fi
        fi
    fi
    
    # Update agent file with agent issue and feature subissues
    if update_agent_file_with_issues "$agent_file" "$agent_issue_number" "$feature_subissues"; then
        if [ -n "$log_file" ]; then
            echo "" >> "$log_file"
            echo "✅ Updated agent file with issue numbers" >> "$log_file"
            local repo_info=$(gh repo view --json owner,name 2>/dev/null || echo "")
            if [ -n "$repo_info" ] && command -v jq >/dev/null 2>&1; then
                local repo_owner=$(echo "$repo_info" | jq -r '.owner.login' 2>/dev/null || echo "")
                local repo_name=$(echo "$repo_info" | jq -r '.name' 2>/dev/null || echo "")
                if [ -n "$repo_owner" ] && [ -n "$repo_name" ]; then
                    echo "   Agent Issue: https://github.com/${repo_owner}/${repo_name}/issues/${agent_issue_number}" >> "$log_file"
                fi
            fi
        else
            echo "✅ Updated agent file with issue numbers"
        fi
    else
        if [ -n "$log_file" ]; then
            echo "⚠️  Issues created but failed to update agent file" >> "$log_file"
        else
            echo "⚠️  Issues created but failed to update agent file" >&2
        fi
    fi
}

# Parse arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <agent-file> [log-file]" >&2
    echo "" >&2
    echo "Creates GitHub issues for agent work in the background." >&2
    echo "If log-file is provided, results are written there instead of stdout." >&2
    exit 1
fi

main "$@"
