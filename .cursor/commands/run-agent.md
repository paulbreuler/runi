# Run Agent

Select the next best agent task from a plan and open it in Cursor, or run a specific agent file.

## Invocation

```
/run-agent [plan-number]
/run-agent --auto
/run-agent --agent [agent-path]
/run-agent --assess [plan-number]
```

## What This Command Does

1. **Selects next best task** (if plan name provided) - Uses scoring algorithm based on:
   - Dependencies (40%): Features with all dependencies PASS get highest score
   - Workload balance (30%): Agents with fewer remaining tasks get higher score
   - Priority (30%): Lower feature IDs (earlier in plan) get higher score

2. **Creates GitHub issues** (if not exists) - Automatically creates GitHub issues for the agent work:
   - **Agent Issue (parent)**: Represents the agent work
     - Title: `[Plan Name] Agent N: [Agent Name] - Features #[N], #[N+1]`
     - Description: Simplified agent summary with reference to local agent file
     - Labels: `agent-work`, `plan-[plan-name]`
   - **Feature Subissues (children)**: One subissue per feature using `gh sub-issue` extension
     - Title: `Feature #X: [Feature Name]`
     - Description: Feature-specific details, files, TL;DR
     - Linked to agent issue as parent
   - **Stores issue numbers**: Agent issue number and feature subissue numbers stored in agent file
   - **Relationship**: Agent issue is parent, feature subissues are children; local agent file is source of truth

3. **Assesses agent status** - Checks completion state and file organization

4. **Opens agent file in Cursor** - Opens the selected or specified agent file with context

5. **Displays instructions** - Shows quick links and next steps

## Usage Examples

### Select and Run Next Task

```
/run-agent 0004-datagrid-overhaul
```

This will:

- Analyze the plan to find the next best agent task
- Display selection with score breakdown
- Verify agent status
- Open the agent file in Cursor
- Show context and instructions

### Auto-Detect Plan from Last PR

```
/run-agent --auto
```

Automatically detects the active plan from the last merged PR and runs the next best task. This is useful when resuming work after a PR merge.

### Run Specific Agent File

```
/run-agent --agent ../runi-planning-docs/plans/0004-datagrid-overhaul/agents/004_agent_selection__expander_columns.agent.md
```

Opens the specified agent file directly in Cursor.

**To find agents**: Use `/plan-list-agents <plan-number>` to see all available agents with clickable links, then use `/run-agent --agent [path]` to run the specific one you want.

### Assess Agent Status

```
/run-agent --assess 0004-datagrid-overhaul
```

Assesses all agents in the plan for completion status and file organization.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Parse arguments:**
   - If `--auto` provided: Call `bash scripts/run-agent.sh --auto` (auto-detects plan from last PR)
   - If `--plan` or plan name provided: Call `just run <plan-name>` or `bash scripts/run-agent.sh --plan <plan-name>`
   - If `--agent` provided: Call `just run-agent <agent-path>` or `bash scripts/run-agent.sh --agent <agent-path>`
   - If `--assess` provided: Call `just assess-agents <plan-name>` or `bash scripts/assess-agent-status.sh --plan <plan-name> --all`

**Note**: The `--auto` flag supports auto-detection from PR context, making it easy to resume work after a PR merge.

2. **Claim Task (CRITICAL - Do this first):**
   - After determining which agent file will be opened, **immediately claim the task** using MCP `claim_task` tool
   - **Extract plan name** from agent file path: `plans/<plan-name>/agents/...` → `<plan-name>` (e.g., `0023-memory-metrics-ui`)
   - **Extract feature number(s)** from agent file content: Look for `### Feature #<number>:` patterns (e.g., `#1`, `#2`)
   - **Construct taskId**: Format is `<plan-name>#<feature-number>` (e.g., `0023-memory-metrics-ui#1`)
   - **Extract agentId** from agent file name: `<agent-file-name>` (e.g., `000_agent_memory_warning.agent.md`)
   - **For agents with multiple features**: Claim each feature separately, or claim the first/primary feature
   - Call: `call_mcp_tool` with server `mcp-planning-server`, tool `claim_task`, arguments:
     ```json
     {
       "taskId": "<plan-name>#<feature-number>",
       "agentId": "<agent-file-name>",
       "persona": "coder"
     }
     ```
   - **Example**: For agent file `plans/0023-memory-metrics-ui/agents/000_agent_memory_warning.agent.md` with Feature #1:
     ```json
     {
       "taskId": "0023-memory-metrics-ui#1",
       "agentId": "000_agent_memory_warning.agent.md",
       "persona": "coder"
     }
     ```
   - **This must happen BEFORE opening the file or starting work** to prevent conflicts
   - **Note**: Server name changed from `user-runi Planning` to `mcp-planning-server` (new location: `../mcp-planning-server`)
   - **Note**: The server expects taskId format `<plan-name>#<feature-number>`, not the agent file path

3. **GitHub Issue Creation:**
   - The script automatically creates GitHub issues when an agent file is opened (if issues don't exist)
   - **Agent Issue (parent)**: Created first, represents the agent work
   - **Feature Subissues (children)**: Created for each feature using `gh sub-issue create --parent <agent-issue>`
   - Issue numbers stored in agent file:
     - `**GitHub Issue**: #123` at top (agent issue)
     - `**GitHub Subissue**: #124` in each feature section
   - Feature subissues will automatically close when PR with `Closes #124, #125, #126` merges to default branch
   - Agent issue remains open (parent issue, not closed by PR)
   - If GitHub CLI or `gh sub-issue` extension is not available, issue creation is skipped (non-blocking)

4. **Display output:**
   - Show task selection results (if applicable)
   - Show agent status assessment
   - Show context and instructions
   - Display clickable file links

5. **Provide guidance:**
   - Explain next steps for the agent
   - Reference related commands (`just close-feature-agent`, `just assess-agents`, `just work`, `just heal`)
   - Show how to verify completion

## Integration with Other Commands

- **work**: Use `/work` first to auto-detect plan, assess status, and see recommendations. Then use `/run-agent --auto` or `/run-agent <plan-name>` to start work
- **plan-list-agents**: Use to find and see all agents in a plan, then use `/run-agent --agent [path]` to run a specific one
- **heal**: After completing work, use `/heal` or `just heal` to auto-cleanup completed agents
- **list-feature-plans**: Use to discover plans, then use `/run-agent <plan-name>`
- **close-feature-agent**: After closing, use `/work` to assess overall status or `/run-agent --assess <plan-name>` to check cleanup
- **update-feature-plan**: After updating, use `/work --plan <plan-name>` to assess status and find next work

## Workflow

### Basic Workflow

```
1. List plans: /list-feature-plans
2. Select next task: /run-agent <plan-name>
3. Agent implements work
4. Verify completion: /close-feature-agent <agent-path>
5. Assess status: /run-agent --assess <plan-name>
6. Repeat from step 2
```

### Smart Orchestration Workflow (Recommended)

```
1. After PR merged: /work (auto-detects plan, assesses status, suggests next task)
2. If cleanup needed: /heal (auto-fixes completed agents)
3. Start next task: /run-agent --auto (uses detected plan) or /run-agent <plan-name>
4. Agent implements work
5. Verify completion: /close-feature-agent <agent-path>
6. Repeat from step 1
```

The smart orchestration workflow (`/work` → `/heal` → `/run-agent`) automatically detects which plan you're working on and suggests the best next action.

## Output Format

The command outputs:

- **Task Selection** (if applicable):
  - Agent name and features
  - Status breakdown (GAP/WIP counts)
  - Score breakdown (dependencies, priority, workload)
  - Agent file path

- **Status Assessment**:
  - File organization status
  - Agent file status vs README.md status
  - Recommendations for cleanup

- **Context Display**:
  - Agent name and features
  - Dependencies status
  - Clickable links to plan.md, interfaces.md, gotchas.md, README.md
  - Instructions for next steps

## Example Output

```
Next Best Task: 004_agent_selection__expander_columns.agent.md

Agent: Selection & Expander Columns
Features: #4, #5, #6
Status: 2 GAP, 1 WIP
Score: 85/100
  - Dependencies: 40/40 (all unblocked)
  - Priority: 25/30 (avg feature #5)
  - Workload: 20/30 (3 remaining tasks)

🚀 Starting Agent Work: 004_agent_selection__expander_columns.agent.md

Agent: Selection & Expander Columns
Features: #4, #5, #6
Dependencies: All satisfied ✓

Quick Links:
  plan.md
  interfaces.md
  gotchas.md
  README.md

Instructions:
1. Agent file opened in Cursor
2. Copy agent file content to Cursor Agent Chat
3. Agent implements features per spec
4. Run: just assess-agents 0004-datagrid-overhaul when done
5. Run: just close-feature-agent [agent-path] to verify completion
```

## Error Handling

- **No unblocked tasks**: Reports "All tasks completed or blocked"
- **Agent file missing**: Reports error with suggestions
- **Plan not found**: Suggests using `/list-feature-plans` to find correct plan name
- **Cursor CLI not found**: Shows installation instructions

## Notes

- The command uses Cursor's `cursor://file/` URL scheme for clickable links
- Agent files are opened with `cursor -r` to reuse current window (if `window.openFilesInNewWindow` is set to `off`)
- Status assessment checks both file organization and README.md status matrix
- Scoring algorithm prioritizes unblocked tasks to maximize parallel work
- The `--auto` flag auto-detects the active plan from the last merged PR (uses GitHub CLI to analyze PR title, branch, description, and files)
- For best results, use `/work` first to get a complete status overview, then use `/run-agent --auto` to start the next task
