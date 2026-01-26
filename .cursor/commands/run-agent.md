# Run Agent

Select the next best agent task from a plan and open it in Cursor, or run a specific agent file.

**Note**: This command now uses `limps` CLI directly. The old `run-agent.sh` script has been
replaced with minimal wrapper scripts.

## Invocation

```bash
/run-agent [plan-number]
/run-agent --auto
/run-agent --agent [agent-path]
/run-agent --assess [plan-number]
```

## What This Command Does

1. **Selects next best task** (if plan name provided) - Uses `npx limps next-task` which
   implements scoring algorithm based on:
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

3. **Assesses agent status** - Uses `npx limps status` to check completion state and file organization

4. **Opens agent file in Cursor** - Opens the selected or specified agent file with context

5. **Displays instructions** - Shows quick links and next steps

## Usage Examples

### Select and Run Next Task

```bash
/run-agent 0004-datagrid-overhaul
```

Or use limps directly:

```bash
npx limps next-task 0004-datagrid-overhaul
```

This will:

- Use `npx limps next-task` to find the next best agent task
- Display selection with score breakdown from limps
- Open the agent file in Cursor
- Optionally create GitHub issues in the background

### Auto-Detect Plan from Last PR

```bash
/run-agent --auto
```

Automatically detects the active plan from the last merged PR and runs the next best task.
This is useful when resuming work after a PR merge.

### Run Specific Agent File

```bash
/run-agent --agent ../runi-planning-docs/plans/0004-datagrid-overhaul/agents/004_agent_selection__expander_columns.agent.md
```

Or open directly with cursor:

```bash
cursor ../runi-planning-docs/plans/0004-datagrid-overhaul/agents/004_agent_selection__expander_columns.agent.md
```

Opens the specified agent file directly in Cursor.

**To find agents**: Use `npx limps list-agents <plan-number>` to see all available agents, then open the specific one with `cursor [path]`.

### Assess Agent Status

```bash
/run-agent --assess 0004-datagrid-overhaul
```

Use limps directly:

```bash
npx limps status 0004-datagrid-overhaul
```

Assesses all agents in the plan for completion status and file organization.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Parse arguments:**
   - If `--auto` provided: Auto-detect plan from last PR, then use `npx limps next-task <plan-name>` to get next task
   - If `--plan` or plan name provided: Use `npx limps next-task <plan-name>` to get next task, then open the agent file with `cursor`
   - If `--agent` provided: Open the specified agent file directly with `cursor <agent-path>`
   - If `--assess` provided: Use `npx limps status <plan-name>` to assess agent status

**Note**: The workflow now uses `limps` CLI directly. All justfile wrapper commands have been removed.

**Note**: The `--auto` flag supports auto-detection from PR context, making it easy to resume work after a PR merge.

1. **Claim Task (CRITICAL - Do this first):**
   - After determining which agent file will be opened, **immediately claim the task** using MCP
     `claim_task` tool
   - **Extract plan name** from agent file path: `plans/<plan-name>/agents/...` → `<plan-name>` (e.g., `0023-memory-metrics-ui`)
   - **Extract feature number(s)** from agent file content: Look for `### Feature #<number>:` patterns (e.g., `#1`, `#2`)
   - **Construct taskId**: Format is `<plan-name>#<feature-number>` (e.g.,
     `0023-memory-metrics-ui#1`)
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

2. **GitHub Issue Creation:**
   - The script automatically creates GitHub issues when an agent file is opened (if issues don't exist)
   - **Agent Issue (parent)**: Created first, represents the agent work
   - **Feature Subissues (children)**: Created for each feature using `gh sub-issue create --parent <agent-issue>`
   - Issue numbers stored in agent file:
     - `**GitHub Issue**: #123` at top (agent issue)
     - `**GitHub Subissue**: #124` in each feature section
   - Feature subissues will automatically close when PR with `Closes #124, #125, #126` merges to default branch
   - Agent issue remains open (parent issue, not closed by PR)
   - If GitHub CLI or `gh sub-issue` extension is not available, issue creation is skipped (non-blocking)

3. **Display output:**
   - Show task selection results (if applicable)
   - Show agent status assessment
   - Show context and instructions
   - Display clickable file links

4. **Provide guidance:**
   - Explain next steps for the agent
   - Reference related commands (`/close-feature-agent`, `npx limps status`, `npx limps next-task`, `just heal`)
   - Show how to verify completion

## Integration with Other Commands

- **next-task**: Use `npx limps next-task <plan-name>` to get the next best task, then open the agent file with `cursor`
- **plan-list-agents**: Use `npx limps list-agents <plan-name>` to find and see all agents in a plan, then open the specific one with `cursor <path>`
- **heal**: After completing work, use `/heal` or `just heal` to auto-cleanup completed agents
- **list-feature-plans**: Use to discover plans, then use `npx limps next-task <plan-name>` to get next task
- **close-feature-agent**: After closing, use `npx limps status <plan-name>` to assess overall status
- **update-feature-plan**: After updating, use `npx limps next-task <plan-name>` to get next task

## Workflow

### Basic Workflow

```bash
1. List plans: /list-feature-plans
2. Select next task: /run-agent <plan-name>
3. Agent implements work
4. Verify completion: /close-feature-agent <agent-path>
5. Assess status: /run-agent --assess <plan-name>
6. Repeat from step 2
```

### Smart Orchestration Workflow (Recommended)

```bash
1. After PR merged: `npx limps next-task <plan-name>` (suggests next task)
2. If cleanup needed: `just heal` (auto-fixes completed agents)
3. Start next task: `npx limps next-task <plan-name>` then open agent file with `cursor`
4. Agent implements work
5. Verify completion: /close-feature-agent <agent-path>
6. Repeat from step 1
```

The workflow uses limps CLI directly for task selection, then opens files with `cursor`.

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

```text
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
4. Run: npx limps status 0004-datagrid-overhaul when done
5. Run: /close-feature-agent [agent-path] to verify completion
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
- The `--auto` flag auto-detects the active plan from the last merged PR (uses GitHub CLI to
  analyze PR title, branch, description, and files)
- For best results, use `npx limps next-task` first to get the next task, then use
  `/run-agent --auto` to start it
