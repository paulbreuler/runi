# Heal Ralph Files

Heal and improve Ralph documentation files using a Claude-guided prompt.

## Instructions for Claude

**When this command is invoked with a prompt, you must:**

1. **Extract the healing prompt** from the user's message (everything after `/heal-ralph`)
2. **Execute the `just` command:** Run `just heal-ralph "<healing prompt>"` in the terminal
3. **Display the output** from the command execution
4. **Use the generated analysis** along with open files to suggest specific edits
5. **Help apply changes** by providing file-specific edits based on the analysis

**Example:**

- User types: `/heal-ralph update all layout references to use horizontal split`
- You execute: `just heal-ralph "update all layout references to use horizontal split"`
- You display the output and use it to suggest file edits

## What This Does

This command leverages the `just heal-ralph` command to analyze and suggest improvements to Ralph documentation files (prompts, specs, fix plans) based on your healing request. It dynamically discovers all Ralph files and generates an analysis prompt for review.

## Usage

### In Cursor Chat

Type `/heal-ralph` followed by your healing prompt:

```
/heal-ralph update all layout references to use horizontal split
```

or

```
/heal-ralph add design principles to all prompts
```

**When invoked, this command will:**

1. Execute `just heal-ralph` with your prompt
2. Display the generated analysis
3. Help you apply the suggested changes using Claude Code

### Via Command Palette

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Ralph: Heal Files"
3. Enter your healing prompt when prompted

## How It Works

When you invoke this command, Claude will:

1. **Execute the `just` command:** Run `just heal-ralph` with your prompt as an argument
2. **Process the output:** The script will:
   - Dynamically discover all Ralph files (no hardcoded lists)
   - Generate a structured analysis prompt
   - Provide file inventory and next steps
3. **Help apply changes:** Claude will use the analysis to suggest specific file edits

**The underlying script (`scripts/heal-ralph.sh`):**

- Discovers files automatically: `@fix_plan.md`, `specs/requirements.md`, `PROMPT.md`, `CLAUDE.md`, and all `prompts/*.md` files
- Generates analysis prompts for Claude
- Adapts to your project structure (no maintenance needed)

## Examples

### Fix Layout References

```
/heal-ralph update all layout references to use VS Code-style horizontal split (Request left, Response right)
```

### Add Design Principles

```
/heal-ralph add design principles (high contrast, subtle interactions, clean interface) to all prompts
```

### Update Terminology

```
/heal-ralph replace "vertical split" with "horizontal split" and update all wireframes
```

## Workflow

1. Invoke `/heal-ralph` with your healing prompt
2. Claude executes `just heal-ralph` and displays the output
3. Review the generated analysis prompt
4. Claude uses the analysis + open files to suggest specific edits
5. Review and apply the suggested changes
6. Validate with `just validate-ralph`

## Direct CLI Usage

You can also run the command directly in terminal for automation and chaining:

```bash
just heal-ralph "your healing prompt here"
just heal-ralph --prompt-file prompts/heal-request.md
just heal-ralph --dry-run "preview changes"
```

**Note:** The Cursor command (`/heal-ralph`) executes this same `just` command automatically.

## Notes

- **Dynamic Discovery:** No need to maintain file lists - files are discovered automatically
- **Analysis Only:** This command generates analysis prompts; Claude Code applies the actual changes
- **Validation:** After applying changes, run `just validate-ralph` to verify consistency
- **Dry Run:** Use `--dry-run` flag in CLI to preview without generating full analysis

## Related Commands

- `just normalize-ralph` - Normalize all Ralph files for consistency
- `just validate-ralph` - Validate Ralph file consistency
- `just clean-ralph` - Remove all Ralph session files
