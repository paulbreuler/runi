# Review MCP/LLM

Run the MCP/LLM-focused review skill for this repo.

## Invocation

```
/review-mcp [scope]
```

## Instructions for Claude

1. Invoke the skill: `/mcp-code-review $ARGUMENTS`
2. If no arguments are provided, review the current git diff.

## Notes

- This command provides a simple entry point for MCP/LLM security-focused code review
- For general code review, use `/code-review` instead
- **Current focus**: Reviews MCP tool usage in commands (runi uses MCP tools as a client)
- **Future focus**: Will review MCP server implementation when runi adds its own MCP server
- The MCP code review skill focuses on security, MCP tool usage safety, and LLM-related concerns
