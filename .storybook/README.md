# Storybook Configuration

## Viewing Interaction Tests

Interaction tests run automatically when viewing stories, but you need to:

1. **Switch to Canvas view** (not Docs view)
   - Click the "Canvas" tab at the top of the story view
   - Docs view shows documentation but doesn't run interactions

2. **Open the Interactions panel**
   - Look for the "Interactions" tab in the bottom panel
   - This shows the test steps as they execute
   - You can see each step pass/fail in real-time

3. **For MainLayout stories:**
   - The interactions test sidebar toggle, keyboard shortcuts, and pane resizer
   - Tests run automatically when you load the story

## Story Organization

- **Layout/** - MainLayout, Sidebar, StatusBar components
- **Request/** - Request building components (coming in Run 2B)
- **Response/** - Response viewing components (coming in Run 2C)
- **ui/** - Base UI components

## Running Tests

```bash
# Start Storybook
npm run storybook

# View interaction tests:
# 1. Select a story from sidebar
# 2. Switch to "Canvas" tab (not "Docs")
# 3. Open "Interactions" panel at bottom
# 4. Tests run automatically
```
