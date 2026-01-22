#!/usr/bin/env bash
# Run agent task - select next best task or open specific agent file in Cursor

set -euo pipefail

# ANSI color codes
RESET='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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

# Function to create clickable hyperlink
create_hyperlink() {
    local full_path="$1"
    local display_text="$2"
    local encoded_path
    encoded_path=$(printf '%s' "$full_path" | sed 's/ /%20/g' | sed 's/#/%23/g' | sed 's/\[/%5B/g' | sed 's/\]/%5D/g')
    encoded_path="${encoded_path#/}"
    printf '\e]8;;cursor://file/%s\e\\%s\e]8;;\e\\' "$encoded_path" "$display_text"
}

# Function to extract GitHub issue number from agent file
extract_issue_number() {
    local agent_file="$1"
    if [ ! -f "$agent_file" ]; then
        return 1
    fi
    
    # Look for "**GitHub Issue**: #123" pattern
    local issue_line=$(grep -E '\*\*GitHub Issue\*\*:\s*#?[0-9]+' "$agent_file" | head -1)
    if [ -z "$issue_line" ]; then
        return 1
    fi
    
    # Extract issue number
    echo "$issue_line" | sed -E 's/.*\*\*GitHub Issue\*\*:\s*#?([0-9]+).*/\1/'
    return 0
}

# Function to extract agent metadata for issue creation
extract_agent_metadata() {
    local agent_file="$1"
    
    # Extract agent name from first line
    local agent_name=$(head -1 "$agent_file" | sed 's/^# Agent [0-9]*: //' | sed 's/\*\*Plan Location\*\*.*//' | sed 's/\*\*GitHub Issue\*\*.*//' | xargs)
    
    # Extract agent number
    local agent_num=$(head -1 "$agent_file" | sed -E 's/^# Agent ([0-9]+):.*/\1/')
    
    # Extract plan name from file path
    local plan_name=$(echo "$agent_file" | sed -E 's|.*/plans/([^/]+)/.*|\1|')
    
    # Extract feature data (numbers, names, TL;DRs, files per feature)
    local feature_numbers=()
    local feature_names=()
    local feature_tldrs=()
    local feature_files_map=()
    
    local current_feature=""
    local current_feature_files=""
    local in_feature_files_section=false
    
    while IFS= read -r line; do
        # Feature header
        if [[ "$line" =~ ^###\ Feature\ #([0-9]+):\ (.+)$ ]]; then
            # Save previous feature files if any
            if [ -n "$current_feature" ]; then
                feature_files_map+=("${current_feature}:${current_feature_files}")
            fi
            
            current_feature="${BASH_REMATCH[1]}"
            local feature_name="${BASH_REMATCH[2]}"
            feature_numbers+=("${current_feature}")
            feature_names+=("${current_feature}:${feature_name}")
            current_feature_files=""
            in_feature_files_section=false
        # Feature TL;DR
        elif echo "$line" | grep -qE '\*\*TL;DR\*\*:' && [ -n "$current_feature" ]; then
            local tldr=$(echo "$line" | sed -E 's/.*\*\*TL;DR\*\*:[[:space:]]+(.*)/\1/')
            feature_tldrs+=("${current_feature}:${tldr}")
        # Feature files section
        elif echo "$line" | grep -qE '\*\*Files to Create/Modify\*\*:' && [ -n "$current_feature" ]; then
            in_feature_files_section=true
        elif [ "$in_feature_files_section" = true ] && [ -n "$current_feature" ]; then
            if echo "$line" | grep -qE '^[[:space:]]*-[[:space:]]*`'; then
                local file=$(echo "$line" | sed -E 's/^[[:space:]]*-[[:space:]]*`([^`]+)`.*/\1/')
                if [ -n "$file" ]; then
                    current_feature_files="${current_feature_files}${current_feature_files:+ }${file}"
                fi
            elif [[ "$line" =~ ^###\ Feature\ # ]] || echo "$line" | grep -qE '^##[^#]'; then
                # New section starts, save current feature files
                if [ -n "$current_feature" ]; then
                    feature_files_map+=("${current_feature}:${current_feature_files}")
                    current_feature=""
                    in_feature_files_section=false
                fi
            fi
        fi
    done < "$agent_file"
    
    # Save last feature files
    if [ -n "$current_feature" ]; then
        feature_files_map+=("${current_feature}:${current_feature_files}")
    fi
    
    # Format as strings
    local feature_numbers_str=""
    if [ ${#feature_numbers[@]} -gt 0 ]; then
        IFS=',' feature_numbers_str="${feature_numbers[*]}"
    fi
    
    local feature_names_str=""
    if [ ${#feature_names[@]} -gt 0 ]; then
        IFS='|' feature_names_str="${feature_names[*]}"
    fi
    
    local feature_tldrs_str=""
    if [ ${#feature_tldrs[@]} -gt 0 ]; then
        IFS='|' feature_tldrs_str="${feature_tldrs[*]}"
    fi
    
    local feature_files_str=""
    if [ ${#feature_files_map[@]} -gt 0 ]; then
        IFS='|' feature_files_str="${feature_files_map[*]}"
    fi
    
    echo "${agent_name}|${agent_num}|${plan_name}|${feature_numbers_str}|${feature_names_str}|${feature_tldrs_str}|${feature_files_str}"
}

# Function to create feature subissue
create_feature_subissue() {
    local parent_issue="$1"
    local feature_num="$2"
    local feature_name="$3"
    local feature_tldr="$4"
    local feature_files="$5"
    local agent_issue_num="$6"
    local agent_name="$7"
    local plan_name="$8"
    
    # Check if gh sub-issue extension is available
    if ! command -v gh >/dev/null 2>&1 || ! gh extension list 2>/dev/null | grep -q "gh-sub-issue"; then
        echo -e "${YELLOW}⚠️  gh sub-issue extension not found. Skipping subissue creation.${RESET}" >&2
        return 1
    fi
    
    # Get repository owner and name
    local repo_info=$(gh repo view --json owner,name 2>/dev/null || echo "")
    if [ -z "$repo_info" ]; then
        echo -e "${YELLOW}⚠️  Could not determine repository. Skipping subissue creation.${RESET}" >&2
        return 1
    fi
    
    local repo_owner=""
    local repo_name=""
    if command -v jq >/dev/null 2>&1; then
        repo_owner=$(echo "$repo_info" | jq -r '.owner.login' 2>/dev/null || echo "")
        repo_name=$(echo "$repo_info" | jq -r '.name' 2>/dev/null || echo "")
    else
        repo_owner=$(echo "$repo_info" | grep -oE '"owner"[^}]*"login"[^"]*"([^"]+)"' | sed -E 's/.*"login"[^"]*"([^"]+)".*/\1/' || echo "")
        repo_name=$(echo "$repo_info" | grep -oE '"name"[^,}]*"([^"]+)"' | sed -E 's/.*"name"[^"]*"([^"]+)".*/\1/' || echo "")
    fi
    
    if [ -z "$repo_owner" ] || [ -z "$repo_name" ]; then
        echo -e "${YELLOW}⚠️  Could not parse repository info. Skipping subissue creation.${RESET}" >&2
        return 1
    fi
    
    # Create subissue title
    local subissue_title="Feature #${feature_num}: ${feature_name}"
    
    # Create subissue body
    local subissue_body="## Feature #${feature_num}: ${feature_name}

**Parent Issue**: #${agent_issue_num} (${agent_name})
**Status**: In Progress
**TL;DR**: ${feature_tldr:-No description}

### Files
"
    
    if [ -n "$feature_files" ]; then
        IFS=' ' read -ra FILES_ARRAY <<< "$feature_files"
        for file in "${FILES_ARRAY[@]}"; do
            if [ -n "$file" ]; then
                subissue_body="${subissue_body}
- \`${file}\`"
            fi
        done
    else
        subissue_body="${subissue_body}
- (See agent file for file list)"
    fi
    
    subissue_body="${subissue_body}

---

This subissue tracks Feature #${feature_num} from ${agent_name}. See parent issue #${agent_issue_num} for agent context and the local agent file for complete execution context, TDD cycles, and feature specifications."
    
    # Create subissue using gh sub-issue extension
    # Use temp file for body since --body with multiline can be tricky
    local temp_body_file=$(mktemp)
    echo "$subissue_body" > "$temp_body_file"
    
    local subissue_output
    subissue_output=$(gh sub-issue create \
        --parent "$parent_issue" \
        --title "$subissue_title" \
        --body "$(cat "$temp_body_file")" \
        --repo "${repo_owner}/${repo_name}" 2>&1) || {
        rm -f "$temp_body_file"
        echo -e "${RED}❌ Failed to create feature subissue:${RESET}" >&2
        echo "$subissue_output" >&2
        rm -f "$temp_body_file"
        return 1
    }
    
    rm -f "$temp_body_file"
    
    # Extract subissue number from output
    local subissue_number=""
    if echo "$subissue_output" | grep -qE 'https://github.com/[^/]+/[^/]+/issues/[0-9]+'; then
        subissue_number=$(echo "$subissue_output" | grep -oE '/issues/[0-9]+' | grep -oE '[0-9]+' | head -1)
    elif echo "$subissue_output" | grep -qE '#[0-9]+'; then
        subissue_number=$(echo "$subissue_output" | grep -oE '#[0-9]+' | grep -oE '[0-9]+' | head -1)
    else
        local subissue_url=$(echo "$subissue_output" | grep -oE 'https://[^[:space:]]+' | head -1)
        if [ -n "$subissue_url" ]; then
            subissue_number=$(echo "$subissue_url" | grep -oE '/issues/[0-9]+' | grep -oE '[0-9]+' | head -1)
        fi
    fi
    
    if [ -z "$subissue_number" ]; then
        echo -e "${YELLOW}⚠️  Subissue created but could not extract issue number.${RESET}" >&2
        echo "$subissue_output" >&2
        return 1
    fi
    
    echo "$subissue_number"
    return 0
}

# Function to create GitHub issue for agent (parent issue)
create_agent_issue() {
    local agent_file="$1"
    local agent_name="$2"
    local agent_num="$3"
    local plan_name="$4"
    local feature_numbers="$5"
    local feature_tldrs="$6"
    local files_list="$7"
    
    # Check if GitHub CLI is available
    if ! command -v gh >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  GitHub CLI not found. Skipping issue creation.${RESET}" >&2
        return 1
    fi
    
    # Check if authenticated
    if ! gh auth status >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated. Skipping issue creation.${RESET}" >&2
        return 1
    fi
    
    # Get repository owner and name
    local repo_info=$(gh repo view --json owner,name 2>/dev/null || echo "")
    if [ -z "$repo_info" ]; then
        echo -e "${YELLOW}⚠️  Could not determine repository. Skipping issue creation.${RESET}" >&2
        return 1
    fi
    
    local repo_owner=""
    local repo_name=""
    if command -v jq >/dev/null 2>&1; then
        repo_owner=$(echo "$repo_info" | jq -r '.owner.login' 2>/dev/null || echo "")
        repo_name=$(echo "$repo_info" | jq -r '.name' 2>/dev/null || echo "")
    else
        # Fallback parsing
        repo_owner=$(echo "$repo_info" | grep -oE '"owner"[^}]*"login"[^"]*"([^"]+)"' | sed -E 's/.*"login"[^"]*"([^"]+)".*/\1/' || echo "")
        repo_name=$(echo "$repo_info" | grep -oE '"name"[^,}]*"([^"]+)"' | sed -E 's/.*"name"[^"]*"([^"]+)".*/\1/' || echo "")
    fi
    
    if [ -z "$repo_owner" ] || [ -z "$repo_name" ]; then
        echo -e "${YELLOW}⚠️  Could not parse repository info. Skipping issue creation.${RESET}" >&2
        return 1
    fi
    
    # Format feature numbers for title
    local feature_list=$(echo "$feature_numbers" | tr ',' ' ' | sed 's/\([0-9]\+\)/#\1/g' | tr ' ' ',')
    
    # Create issue title
    local issue_title="[${plan_name}] Agent ${agent_num}: ${agent_name} - Features ${feature_list}"
    
    # Calculate relative path to agent file from runi-planning-docs root
    # Handle both absolute and relative paths
    local agent_file_rel_path=""
    local normalized_path="$agent_file"
    
    # If path is relative and starts with ../, resolve it
    if [[ "$agent_file" == ../* ]]; then
        # Try to get absolute path for extraction
        if command -v realpath >/dev/null 2>&1; then
            normalized_path=$(realpath "$agent_file" 2>/dev/null || echo "$agent_file")
        fi
    fi
    
    # Extract path relative to runi-planning-docs
    if [[ "$normalized_path" == *"runi-planning-docs"* ]]; then
        agent_file_rel_path=$(echo "$normalized_path" | sed -E 's|.*runi-planning-docs/(.+)$|\1|')
    elif [[ "$agent_file" == *"runi-planning-docs"* ]]; then
        # Fallback: try original path
        agent_file_rel_path=$(echo "$agent_file" | sed -E 's|.*runi-planning-docs/(.+)$|\1|')
    else
        # Fallback: construct from plan name and filename
        agent_file_rel_path="plans/${plan_name}/agents/$(basename "$agent_file")"
    fi
    
    # Create simplified agent issue body (parent issue)
    local issue_body="## Agent: ${agent_name}

**Local Agent File**: \`${agent_file_rel_path}\`
**Plan**: ${plan_name}
**Features**: $(echo "$feature_numbers" | tr ',' ' ' | sed 's/\([0-9]\+\)/#\1/g' | tr ' ' ', ')

This issue represents Agent ${agent_num} work. See feature subissues for individual feature tracking.

### Feature Subissues

_Feature subissues will be created and linked here._

---

**Local Planning Context**

This issue represents agent work defined in:
- **Agent File**: \`${agent_file_rel_path}\`
- **Plan**: \`plans/${plan_name}/plan.md\`

The local agent file contains the complete execution context, TDD cycles, and feature specifications."
    
    # Create labels
    local labels="agent-work,plan-${plan_name}"
    
    # Create issue using GitHub CLI
    local issue_output
    issue_output=$(gh issue create \
        --title "$issue_title" \
        --body "$issue_body" \
        --label "$labels" \
        --repo "${repo_owner}/${repo_name}" 2>&1) || {
        echo -e "${RED}❌ Failed to create GitHub issue:${RESET}" >&2
        echo "$issue_output" >&2
        return 1
    }
    
    # Extract issue number from output
    local issue_number=""
    if echo "$issue_output" | grep -qE 'https://github.com/[^/]+/[^/]+/issues/[0-9]+'; then
        issue_number=$(echo "$issue_output" | grep -oE '/issues/[0-9]+' | grep -oE '[0-9]+' | head -1)
    elif echo "$issue_output" | grep -qE '#[0-9]+'; then
        issue_number=$(echo "$issue_output" | grep -oE '#[0-9]+' | grep -oE '[0-9]+' | head -1)
    else
        # Try to get issue number from API
        local issue_url=$(echo "$issue_output" | grep -oE 'https://[^[:space:]]+' | head -1)
        if [ -n "$issue_url" ]; then
            issue_number=$(echo "$issue_url" | grep -oE '/issues/[0-9]+' | grep -oE '[0-9]+' | head -1)
        fi
    fi
    
    if [ -z "$issue_number" ]; then
        echo -e "${YELLOW}⚠️  Issue created but could not extract issue number.${RESET}" >&2
        echo "$issue_output" >&2
        return 1
    fi
    
    echo "$issue_number"
    return 0
}

# Function to update agent file with issue and subissue numbers
update_agent_file_with_issues() {
    local agent_file="$1"
    local agent_issue_number="$2"
    local feature_subissues="$3"  # Format: "13:37|14:38|15:39"
    
    # Check if file exists
    if [ ! -f "$agent_file" ]; then
        return 1
    fi
    
    # Update or add agent issue number
    if grep -qE '\*\*GitHub Issue\*\*:' "$agent_file"; then
        # Update existing issue number
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/\*\*GitHub Issue\*\*:.*/\*\*GitHub Issue\*\*: #${agent_issue_number}/" "$agent_file"
        else
            sed -i "s/\*\*GitHub Issue\*\*:.*/\*\*GitHub Issue\*\*: #${agent_issue_number}/" "$agent_file"
        fi
    else
        # Add issue number after Plan Location
        if grep -q '\*\*Plan Location\*\*:' "$agent_file"; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "/\*\*Plan Location\*\*:/a\\
**GitHub Issue**: #${agent_issue_number}
" "$agent_file"
            else
                sed -i "/\*\*Plan Location\*\*:/a\\\*\*GitHub Issue\*\*: #${agent_issue_number}" "$agent_file"
            fi
        else
            # Add after agent header (first line)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "1a\\
\\
**GitHub Issue**: #${agent_issue_number}
" "$agent_file"
            else
                sed -i "1a\\\n\*\*GitHub Issue\*\*: #${agent_issue_number}" "$agent_file"
            fi
        fi
    fi
    
    # Update feature sections with subissue numbers
    if [ -n "$feature_subissues" ]; then
        IFS='|' read -ra SUBISSUE_ARRAY <<< "$feature_subissues"
        for subissue_entry in "${SUBISSUE_ARRAY[@]}"; do
            if [[ "$subissue_entry" =~ ^([0-9]+):([0-9]+)$ ]]; then
                local feature_num="${BASH_REMATCH[1]}"
                local subissue_num="${BASH_REMATCH[2]}"
                
                # Check if subissue number already exists for this feature
                if grep -A 5 "^### Feature #${feature_num}:" "$agent_file" | grep -qE '\*\*GitHub Subissue\*\*:'; then
                    # Update existing subissue number
                    if [[ "$OSTYPE" == "darwin"* ]]; then
                        sed -i '' "/^### Feature #${feature_num}:/,/^### Feature #/ {
                            s/\*\*GitHub Subissue\*\*:.*/\*\*GitHub Subissue\*\*: #${subissue_num}/
                        }" "$agent_file"
                    else
                        sed -i "/^### Feature #${feature_num}:/,/^### Feature #/ {
                            s/\*\*GitHub Subissue\*\*:.*/\*\*GitHub Subissue\*\*: #${subissue_num}/
                        }" "$agent_file"
                    fi
                else
                    # Add subissue number after feature header
                    if [[ "$OSTYPE" == "darwin"* ]]; then
                        sed -i '' "/^### Feature #${feature_num}:/a\\
\\
**GitHub Subissue**: #${subissue_num}
" "$agent_file"
                    else
                        sed -i "/^### Feature #${feature_num}:/a\\\n\*\*GitHub Subissue\*\*: #${subissue_num}" "$agent_file"
                    fi
                fi
            fi
        done
    fi
    
    return 0
}

# Main execution
main() {
    local plan_name=""
    local agent_path=""
    local assess_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --plan)
                plan_name="$2"
                shift 2
                ;;
            --agent)
                agent_path="$2"
                shift 2
                ;;
            --assess)
                assess_only=true
                if [ -z "$plan_name" ] && [ $# -gt 1 ]; then
                    plan_name="$2"
                    shift
                fi
                shift
                ;;
            --auto)
                # Auto-detect plan from last PR and auto-select task
                local detected=$(bash "$SCRIPT_DIR/detect-active-plan.sh" 2>/dev/null || echo "")
                if [ -n "$detected" ] && [ -d "$detected" ]; then
                    plan_name=$(basename "$detected")
                else
                    echo "❌ Could not auto-detect plan from PR" >&2
                    exit 1
                fi
                shift
                ;;
            *)
                # Try as plan name if no flag
                if [ -z "$plan_name" ] && [ -z "$agent_path" ]; then
                    plan_name="$1"
                else
                    echo "Unknown option: $1" >&2
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    cd "$PROJECT_ROOT"
    
    # If assess mode, just run assessment
    if [ "$assess_only" = true ]; then
        if [ -z "$plan_name" ]; then
            echo "❌ Plan name required for assessment" >&2
            exit 1
        fi
        # Resolve plan number (1 → 1-plan)
        local resolved_plan=$(resolve_plan_number "$plan_name")
        bash "$SCRIPT_DIR/assess-agent-status.sh" --plan "$resolved_plan" --all
        return
    fi
    
    # If agent path provided, use it directly
    if [ -n "$agent_path" ]; then
        local agent_file="$agent_path"
        if [[ "$agent_file" != /* ]] && [[ "$agent_file" != ../* ]]; then
            # Relative path, try to resolve
            if [ -n "$plan_name" ]; then
                local resolved_plan=$(resolve_plan_number "$plan_name")
                local plan_dir="../runi-planning-docs/plans/$resolved_plan"
                agent_file="$plan_dir/agents/$agent_path"
            fi
        fi
        
        agent_file=$(get_absolute_path "$agent_file")
        
        if [ ! -f "$agent_file" ]; then
            echo "❌ Agent file not found: $agent_file" >&2
            exit 1
        fi
        
        open_agent_file "$agent_file"
        return
    fi
    
    # If plan name provided, select next task
    if [ -n "$plan_name" ]; then
        # Resolve plan number (1 → 1-plan)
        local resolved_plan=$(resolve_plan_number "$plan_name")
        # Get next task
        local next_task_output=$(bash "$SCRIPT_DIR/next-task.sh" --plan "$resolved_plan" 2>&1)
        local agent_file=$(echo "$next_task_output" | tail -1)
        
        if [ -z "$agent_file" ] || [[ "$agent_file" == *"❌"* ]] || [[ "$agent_file" == *"✅"* ]]; then
            echo "$next_task_output" >&2
            exit 1
        fi
        
        # Display selection info (everything except last line)
        local line_count=$(echo "$next_task_output" | wc -l | tr -d ' ')
        if [ "$line_count" -gt 1 ]; then
            echo "$next_task_output" | head -n $((line_count - 1))
        else
            echo "$next_task_output"
        fi
        
        # Verify agent is ready
        echo ""
        echo -e "${DIM}Verifying agent status...${RESET}"
        local plan_dir=$(dirname "$(dirname "$agent_file")")
        local plan_basename=$(basename "$plan_dir")
        bash "$SCRIPT_DIR/assess-agent-status.sh" --agent "$agent_file" --plan "$plan_basename" 2>&1 | grep -v "^$" || true
        
        echo ""
        open_agent_file "$agent_file"
        return
    fi
    
    # No arguments - show usage
    echo "Usage: $0 [--plan <plan-name>] [--agent <agent-path>] [--assess [plan-name]]" >&2
    echo "" >&2
    echo "Examples:" >&2
    echo "  $0 --plan 4" >&2
    echo "  $0 --plan 4-plan" >&2
    echo "  $0 --agent ../runi-planning-docs/plans/.../agents/agent_1.agent.md" >&2
    echo "  $0 --assess 4" >&2
    exit 1
}

# Function to open agent file in Cursor with context
open_agent_file() {
    local agent_file="$1"
    local agent_path=$(get_absolute_path "$agent_file")
    local plan_dir=$(dirname "$(dirname "$agent_file")")
    local agent_name=$(basename "$agent_file" .agent.md)
    
    # Check if GitHub issue exists, create if not
    local existing_issue=$(extract_issue_number "$agent_file" 2>/dev/null || echo "")
    if [ -z "$existing_issue" ]; then
        echo -e "${DIM}Creating GitHub issue and feature subissues for agent...${RESET}"
        
        # Extract agent metadata (now includes per-feature data)
        local metadata=$(extract_agent_metadata "$agent_file")
        IFS='|' read -r agent_display_name agent_num plan_name feature_numbers feature_names feature_tldrs feature_files <<< "$metadata"
        
        # Create agent issue (parent)
        local agent_issue_number
        agent_issue_number=$(create_agent_issue "$agent_file" "$agent_display_name" "$agent_num" "$plan_name" "$feature_numbers" "$feature_tldrs" "" 2>&1)
        
        if [ $? -ne 0 ] || [ -z "$agent_issue_number" ]; then
            echo -e "${YELLOW}⚠️  Failed to create agent issue (non-blocking)${RESET}" >&2
            if [ -n "$agent_issue_number" ]; then
                echo "$agent_issue_number" >&2
            fi
            echo ""
        else
            echo -e "${GREEN}✅ Created agent issue #${agent_issue_number}${RESET}"
            
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
                    echo -e "${GREEN}  ✅ Created feature #${feature_num} subissue #${subissue_number}${RESET}"
                    feature_subissues="${feature_subissues}${feature_subissues:+|}${feature_num}:${subissue_number}"
                else
                    echo -e "${YELLOW}  ⚠️  Failed to create feature #${feature_num} subissue${RESET}" >&2
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
                            # Replace placeholder with actual subissue list
                            local updated_body=$(echo "$current_body" | sed "s/_Feature subissues will be created and linked here._/${subissue_list}/")
                            gh issue edit "$agent_issue_number" --body "$updated_body" --repo "${repo_owner}/${repo_name}" >/dev/null 2>&1 || true
                        fi
                    fi
                fi
            fi
            
            # Update agent file with agent issue and feature subissues
            if update_agent_file_with_issues "$agent_file" "$agent_issue_number" "$feature_subissues"; then
                echo -e "${GREEN}✅ Updated agent file with issue and subissue numbers${RESET}"
                local repo_info=$(gh repo view --json owner,name 2>/dev/null || echo "")
                if [ -n "$repo_info" ] && command -v jq >/dev/null 2>&1; then
                    local repo_owner=$(echo "$repo_info" | jq -r '.owner.login' 2>/dev/null || echo "")
                    local repo_name=$(echo "$repo_info" | jq -r '.name' 2>/dev/null || echo "")
                    if [ -n "$repo_owner" ] && [ -n "$repo_name" ]; then
                        echo -e "${DIM}   Agent Issue: https://github.com/${repo_owner}/${repo_name}/issues/${agent_issue_number}${RESET}"
                    fi
                fi
            else
                echo -e "${YELLOW}⚠️  Issues created but failed to update agent file${RESET}" >&2
            fi
            echo ""
        fi
    else
        echo -e "${DIM}GitHub issue #${existing_issue} already exists${RESET}"
    fi
    
    # Extract agent display name from first line of agent file
    local agent_display=$(head -1 "$agent_file" | sed 's/^# Agent [0-9]*: //' | sed 's/\*\*Plan Location\*\*.*//' | sed 's/\*\*GitHub Issue\*\*.*//' | xargs)
    
    # Extract features from agent file
    local features=()
    local current_feature=""
    while IFS= read -r line; do
        if [[ "$line" =~ ^###\ Feature\ #([0-9]+): ]]; then
            features+=("#${BASH_REMATCH[1]}")
        fi
    done < "$agent_file"
    local feature_list=$(IFS=', '; echo "${features[*]}" | sed 's/,/, /g')
    
    # Get plan files
    local plan_file="$plan_dir/plan.md"
    local readme_file="$plan_dir/README.md"
    local interfaces_file="$plan_dir/interfaces.md"
    local gotchas_file="$plan_dir/gotchas.md"
    
    # Check dependencies (simplified - just check if agent file mentions dependencies)
    local dependencies_ok=true
    if grep -q "BLOCKED\|blocked\|waiting" "$agent_file" 2>/dev/null; then
        dependencies_ok=false
    fi
    
    # Open file in Cursor
    if command -v cursor >/dev/null 2>&1; then
        if ! cursor -r "$agent_path" 2>/dev/null && ! cursor "$agent_path" 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Failed to open agent file in Cursor. You can open it manually at: ${agent_path}${RESET}" >&2
        fi
    else
        echo -e "${YELLOW}⚠️  Cursor CLI not found. Install it from Cursor: Cmd+Shift+P → 'Shell Command: Install cursor command'${RESET}" >&2
    fi
    
    # Display context
    echo ""
    echo -e "${BOLD}${GREEN}🚀 Starting Agent Work: $(basename "$agent_file")${RESET}"
    echo ""
    echo -e "Agent: ${CYAN}$agent_display${RESET}"
    if [ ${#features[@]} -gt 0 ]; then
        echo -e "Features: $feature_list"
    fi
    if [ "$dependencies_ok" = true ]; then
        echo -e "Dependencies: ${GREEN}All satisfied ✓${RESET}"
    else
        echo -e "Dependencies: ${YELLOW}Check agent file for blocked features${RESET}"
    fi
    echo ""
    echo -e "${DIM}Quick Links:${RESET}"
    
    if [ -f "$plan_file" ]; then
        local plan_path=$(get_absolute_path "$plan_file")
        printf "  "
        create_hyperlink "$plan_path" "plan.md"
        echo ""
    fi
    
    if [ -f "$interfaces_file" ]; then
        local interfaces_path=$(get_absolute_path "$interfaces_file")
        printf "  "
        create_hyperlink "$interfaces_path" "interfaces.md"
        echo ""
    fi
    
    if [ -f "$gotchas_file" ]; then
        local gotchas_path=$(get_absolute_path "$gotchas_file")
        printf "  "
        create_hyperlink "$gotchas_path" "gotchas.md"
        echo ""
    fi
    
    if [ -f "$readme_file" ]; then
        local readme_path=$(get_absolute_path "$readme_file")
        printf "  "
        create_hyperlink "$readme_path" "README.md"
        echo ""
    fi
    
    echo ""
    echo -e "${DIM}Instructions:${RESET}"
    echo -e "  1. Agent file opened in Cursor"
    echo -e "  2. Copy agent file content to Cursor Agent Chat"
    echo -e "  3. Agent implements features per spec"
    echo -e "  4. Run: ${CYAN}just assess-agents $(basename "$plan_dir")${RESET} when done"
    echo -e "  5. Run: ${CYAN}just close-feature-agent $agent_path${RESET} to verify completion"
    echo ""
}

main "$@"
