#!/usr/bin/env bash
# Detect active plan from last merged PR

set -euo pipefail

PLANS_DIR="../runi-planning-docs/plans"

# Function to extract plan name from text
extract_plan_name() {
    local text="$1"

    # Build a dynamic pattern from existing plan directories
    # This avoids hardcoding plan names and automatically picks up new plans
    local plan_dirs pattern

    # Get base names of plan directories (supports N-descriptive-name pattern and legacy names)
    plan_dirs=$(find "$PLANS_DIR" -maxdepth 1 -mindepth 1 -type d ! -name "plans" ! -name "templates" -exec basename {} \; 2>/dev/null | \
        sed -E 's/^[0-9]+-plan$//' | \
        sed -E 's/_[0-9a-f]{8,}$//' | \
        sed -E 's/_(overhaul|refactor|features)$//' | \
        grep -v '^$' | \
        sort -u || true)

    # If no plan directories are found, return nothing without failing
    if [ -z "$plan_dirs" ]; then
        return 0
    fi

    # Join directory names into a single alternation pattern: name1|name2|...
    pattern=$(echo "$plan_dirs" | tr '\n' '|' | sed 's/|$//')

    # Try to find plan references in text, allowing suffixes like "_overhaul"
    echo "$text" | grep -oE "(${pattern})[_a-z0-9]*" | head -1 || true
}

# Function to normalize plan name for matching
normalize_plan_name() {
    local name="$1"
    # Convert to lowercase, replace hyphens with underscores
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/-/_/g' | sed 's/^feat[_\//]//' | sed 's/^fix[_\//]//'
}

# Function to find matching plan directory
find_matching_plan() {
    local search_term="$1"
    local normalized=$(normalize_plan_name "$search_term")
    
    # Try exact match first
    local exact_match=$(find "$PLANS_DIR" -maxdepth 1 -type d -name "*${normalized}*" ! -name "plans" ! -name "templates" | head -1)
    if [ -n "$exact_match" ]; then
        echo "$exact_match"
        return 0
    fi
    
    # Try partial match (remove common suffixes)
    local base_name=$(echo "$normalized" | sed -E 's/_(overhaul|refactor|features)$//')
    local partial_match=$(find "$PLANS_DIR" -maxdepth 1 -type d -name "*${base_name}*" ! -name "plans" ! -name "templates" | head -1)
    if [ -n "$partial_match" ]; then
        echo "$partial_match"
        return 0
    fi
    
    return 1
}

# Function to check if files reference plan directories
check_files_for_plan() {
    local files_json="$1"
    
    # Extract file paths and check if any reference plan directories
    echo "$files_json" | grep -oE "runi-planning-docs/plans/[^/]+" | sed 's/runi-planning-docs\/plans\///' | sort -u | head -1 || true
}

# Main execution
main() {
    local output_json=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --json)
                output_json=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # Check if GitHub CLI is available
    if ! command -v gh >/dev/null 2>&1; then
        if [ "$output_json" = true ]; then
            echo '{"error": "GitHub CLI not available", "plan_name": "", "plan_dir": "", "confidence": "none"}'
        else
            echo "❌ GitHub CLI not available. Install with: brew install gh" >&2
            echo "   Falling back to recent file modifications..." >&2
        fi
        # Fallback: check recently modified agent files
        local recent_plan=$(find "$PLANS_DIR" -name "*.agent.md" -type f -mtime -7 2>/dev/null | head -1 | xargs dirname | xargs dirname | xargs basename)
        if [ -n "$recent_plan" ]; then
            local plan_dir="$PLANS_DIR/$recent_plan"
            if [ -d "$plan_dir" ]; then
                if [ "$output_json" = true ]; then
                    echo "{\"plan_name\": \"$recent_plan\", \"plan_dir\": \"$plan_dir\", \"confidence\": \"low\", \"source\": \"recent_files\"}"
                else
                    echo "$plan_dir"
                fi
                return 0
            fi
        fi
        return 1
    fi
    
    # Get last merged PR
    local pr_data=$(gh pr list --state merged --limit 1 --json number,title,headRefName,body,files 2>/dev/null || echo "[]")
    
    if [ "$pr_data" = "[]" ] || [ -z "$pr_data" ]; then
        if [ "$output_json" = true ]; then
            echo '{"error": "No merged PRs found", "plan_name": "", "plan_dir": "", "confidence": "none"}'
        else
            echo "❌ No merged PRs found" >&2
        fi
        return 1
    fi
    
    # Extract PR information (prefer jq for robust JSON parsing, fallback to grep/sed)
    local pr_number=""
    local pr_title=""
    local pr_branch=""
    local pr_body=""
    local pr_files=""

    if command -v jq >/dev/null 2>&1; then
        pr_number=$(echo "$pr_data" | jq -r '.[0].number // empty')
        pr_title=$(echo "$pr_data" | jq -r '.[0].title // empty')
        pr_branch=$(echo "$pr_data" | jq -r '.[0].headRefName // empty')
        pr_body=$(echo "$pr_data" | jq -r '.[0].body // empty')
        # Produce a newline-separated list of file paths for check_files_for_plan
        pr_files=$(echo "$pr_data" | jq -r '.[0].files[]?.path // empty')
    else
        # Fallback to grep/sed (may break with escaped quotes or complex JSON)
        pr_number=$(echo "$pr_data" | grep -o '"number":[0-9]*' | grep -o '[0-9]*' || echo "")
        pr_title=$(echo "$pr_data" | grep -o '"title":"[^"]*"' | sed 's/"title":"//' | sed 's/"$//' || echo "")
        pr_branch=$(echo "$pr_data" | grep -o '"headRefName":"[^"]*"' | sed 's/"headRefName":"//' | sed 's/"$//' || echo "")
        pr_body=$(echo "$pr_data" | grep -o '"body":"[^"]*"' | sed 's/"body":"//' | sed 's/"$//' || echo "")
        pr_files=$(echo "$pr_data" | grep -o '"files":\[.*\]' || echo "")
    fi
    
    # Try to extract plan name from multiple sources (priority order)
    local detected_plan=""
    local source=""
    local confidence="low"
    
    # 1. Check files for plan directory references
    if [ -n "$pr_files" ]; then
        local plan_from_files=$(check_files_for_plan "$pr_files")
        if [ -n "$plan_from_files" ]; then
            detected_plan="$plan_from_files"
            source="pr_files"
            confidence="high"
        fi
    fi
    
    # 2. Extract from PR title (e.g., "feat(datagrid): ..." → "datagrid")
    if [ -z "$detected_plan" ] && [ -n "$pr_title" ]; then
        local title_plan=$(extract_plan_name "$pr_title")
        if [ -n "$title_plan" ]; then
            local matched=$(find_matching_plan "$title_plan")
            if [ -n "$matched" ]; then
                detected_plan=$(basename "$matched")
                source="pr_title"
                confidence="high"
            fi
        fi
    fi
    
    # 3. Extract from branch name (e.g., "feat/datagrid-overhaul" → "datagrid_overhaul")
    if [ -z "$detected_plan" ] && [ -n "$pr_branch" ]; then
        local branch_plan=$(extract_plan_name "$pr_branch")
        if [ -n "$branch_plan" ]; then
            local matched=$(find_matching_plan "$branch_plan")
            if [ -n "$matched" ]; then
                detected_plan=$(basename "$matched")
                source="pr_branch"
                confidence="medium"
            fi
        fi
    fi
    
    # 4. Extract from PR description
    if [ -z "$detected_plan" ] && [ -n "$pr_body" ]; then
        local body_plan=$(extract_plan_name "$pr_body")
        if [ -n "$body_plan" ]; then
            local matched=$(find_matching_plan "$body_plan")
            if [ -n "$matched" ]; then
                detected_plan=$(basename "$matched")
                source="pr_description"
                confidence="medium"
            fi
        fi
    fi
    
    # If still no plan found, try to match based on PR content keywords
    if [ -z "$detected_plan" ]; then
        # Check for common keywords that might map to plans
        local search_text="${pr_title} ${pr_branch} ${pr_body}"
        
        # Try to find any plan that matches keywords
        for plan_dir in "$PLANS_DIR"/*; do
            if [ ! -d "$plan_dir" ]; then
                continue
            fi
            
            local plan_basename=$(basename "$plan_dir")
            local plan_keywords=$(echo "$plan_basename" | sed 's/_[0-9a-f]*$//' | sed 's/_[0-9]*$//' | sed 's/_overhaul$//' | sed 's/_refactor$//' | sed 's/_features$//')
            
            if echo "$search_text" | grep -qi "$plan_keywords"; then
                detected_plan="$plan_basename"
                source="keyword_match"
                confidence="low"
                break
            fi
        done
    fi
    
    # Output result
    if [ -z "$detected_plan" ]; then
        if [ "$output_json" = true ]; then
            echo "{\"error\": \"Could not detect plan from PR\", \"plan_name\": \"\", \"plan_dir\": \"\", \"confidence\": \"none\", \"pr_number\": $pr_number, \"pr_title\": \"$pr_title\"}"
        else
            echo "❌ Could not detect plan from PR #$pr_number: $pr_title" >&2
            echo "   Try specifying plan manually: just work --plan <plan-name>" >&2
        fi
        return 1
    fi
    
    local plan_dir="$PLANS_DIR/$detected_plan"
    
    if [ ! -d "$plan_dir" ]; then
        if [ "$output_json" = true ]; then
            echo "{\"error\": \"Plan directory not found\", \"plan_name\": \"$detected_plan\", \"plan_dir\": \"$plan_dir\", \"confidence\": \"$confidence\"}"
        else
            echo "❌ Plan directory not found: $plan_dir" >&2
        fi
        return 1
    fi
    
    if [ "$output_json" = true ]; then
        echo "{\"plan_name\": \"$detected_plan\", \"plan_dir\": \"$plan_dir\", \"confidence\": \"$confidence\", \"source\": \"$source\", \"pr_number\": $pr_number, \"pr_title\": \"$pr_title\"}"
    else
        echo "$plan_dir"
    fi
}

main "$@"
