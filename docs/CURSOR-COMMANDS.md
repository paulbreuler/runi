# Cursor Commands for Ralph

**Purpose:** Cursor command integration for Ralph file management

## Available Commands

### Heal Ralph Files

**Usage:** Type `/heal-ralph` followed by your prompt in Cursor chat

The command executes `just heal-ralph` with your prompt and uses the output to suggest file edits.

**Example:**
```
/heal-ralph update all layout references to use horizontal split
```

**What it does:**
1. Executes `just heal-ralph "<your prompt>"` 
2. Displays the generated analysis
3. Uses the analysis + open files to suggest specific edits

## Direct CLI Usage

You can also run commands directly in terminal:

```bash
just normalize-ralph    # Normalize all Ralph files
just validate-ralph      # Validate consistency
just heal-ralph "prompt" # Generate analysis (or use /heal-ralph in Cursor)
just clean-ralph         # Clean session files
```

## Implementation

Cursor commands are defined in `.cursor/commands/` as Markdown (`.md`) files:
- Commands can be invoked from chat (`/command-name`) or Command Palette
- Scripts are in `scripts/` directory
- See [Cursor Commands Documentation](https://docs.cursor.com/en/agent/chat/commands)

## References

- [Ralph File Structure](./RALPH-FILE-STRUCTURE.md)
