# Create Pull Request

Create a pull request following runi's conventions.

## Instructions

1. First, gather context by running these commands in parallel:
   - `git status` to see all untracked files
   - `git diff` to see staged and unstaged changes
   - `git log --oneline -10` to see recent commit style
   - `git branch --show-current` to get current branch name
   - `git diff main...HEAD` (or appropriate base branch) to see all changes in this PR

2. Analyze ALL commits that will be included in the PR (not just the latest)

3. Determine the appropriate conventional commit type for the PR title:
   - `feat`: New feature
   - `fix`: Bug fix
   - `test`: Adding tests
   - `refactor`: Code refactoring
   - `docs`: Documentation
   - `style`: Formatting (no code change)
   - `chore`: Maintenance

4. Format the PR title as: `<type>(<scope>): <description>`
   - Example: `feat(http): add request timeout configuration`
   - Example: `fix(ui): resolve header tab overflow on small screens`

5. Create the PR with this body format:
   ```
   ## Summary
   - <bullet point 1>
   - <bullet point 2>
   - <bullet point 3 if needed>

   ## Test plan
   - [ ] <testing step 1>
   - [ ] <testing step 2>
   - [ ] <additional steps as needed>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

6. Push to remote with `-u` flag if needed, then create the PR:
   ```bash
   gh pr create --title "<type>(<scope>): <description>" --body "$(cat <<'EOF'
   ## Summary
   - ...

   ## Test plan
   - [ ] ...

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

7. Return the PR URL when complete.

## Important Notes

- Keep the summary focused on the "why" rather than the "what"
- Ensure the PR title accurately reflects the changes (add = new feature, update = enhancement, fix = bug fix)
- Do NOT push unless necessary for creating the PR
- If there are uncommitted changes, ask the user if they want to commit first
