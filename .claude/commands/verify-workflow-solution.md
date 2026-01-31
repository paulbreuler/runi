# Verify Workflow Solution

A systematic process for verifying that a GitHub Actions workflow solution will work before implementation.

## Purpose

When proposing a workflow solution, verify it against:

1. **Authoritative sources** (GitHub Actions docs, action documentation)
2. **Actual command execution** (test the commands that will run)
3. **Workflow structure** (job dependencies, outputs, conditionals)
4. **Edge cases** (error handling, idempotency, race conditions)

## Process

### 1. Understand the Problem

- [ ] Identify what the workflow needs to accomplish
- [ ] Understand the current failure mode
- [ ] Identify constraints (timing, permissions, dependencies)

### 2. Research Authoritative Sources

For each component of the solution:

- [ ] **GitHub Actions Documentation**
  - Search: `docs.github.com/en/actions/...`
  - Verify: Event triggers, job dependencies, outputs, contexts
  - Key docs:
    - Events: <https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows>
    - Workflow syntax: <https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions>
    - Contexts: <https://docs.github.com/en/actions/learn-github-actions/contexts>

- [ ] **Action Documentation**
  - Read: Action's README, action.yml, or official docs
  - Verify: Inputs, outputs, behavior with different configurations
  - Check: Known issues, limitations, version compatibility

- [ ] **API Documentation** (if using GitHub/External APIs)
  - Verify: Endpoint, authentication, request/response format
  - Test: Actual API calls with `gh api` or `curl`

### 3. Test Commands Locally

For each command/script that will run in the workflow:

- [ ] **Extract the exact command** from the workflow
- [ ] **Run it locally** with the same environment (git repo, permissions)
- [ ] **Verify output** matches expectations
- [ ] **Test edge cases**:
  - Empty input
  - Missing files/resources
  - Already-existing resources (idempotency)
  - Error conditions

**Example Test Pattern:**

```bash
# Test git history detection
git log --grep="pattern" --format="%H|%s" -n 50

# Test version extraction
echo "commit message" | sed -nE 's/pattern/\1/p'

# Test API calls
gh api repos/{owner}/{repo}/endpoint -X METHOD -f param=value

# Test full script logic
cat > /tmp/test-script.sh << 'EOF'
# Full script here
EOF
chmod +x /tmp/test-script.sh
/tmp/test-script.sh
```

### 4. Verify Workflow Structure

- [ ] **Job Dependencies**
  - Verify: All `needs` relationships are correct
  - Check: No circular dependencies
  - Ensure: Outputs are available when needed

- [ ] **Conditionals**
  - Verify: All `if` conditions use correct syntax
  - Check: Conditions reference valid outputs/contexts
  - Test: Both true and false paths

- [ ] **Permissions**
  - Verify: Each job has required permissions
  - Check: `contents: write` for tag/release creation
  - Ensure: `GITHUB_TOKEN` has sufficient scope

- [ ] **Outputs**
  - Verify: All outputs are set before being used
  - Check: Output names match between jobs
  - Ensure: Outputs are passed through correctly

### 5. Test End-to-End Flow

Create a test scenario that simulates the workflow:

- [ ] **Simulate trigger condition**
  - Create test commit/PR that matches pattern
  - Or use `workflow_dispatch` to test manually

- [ ] **Verify each job would run**
  - Check: Job conditions evaluate correctly
  - Verify: Dependencies are satisfied
  - Ensure: No skipped jobs unexpectedly

- [ ] **Test error paths**
  - What happens if detection fails?
  - What happens if tag creation fails?
  - What happens if build fails?

### 6. Document Proof

Create a proof document with:

- [ ] **Test results** (command outputs)
- [ ] **Authoritative source citations** (URLs, quotes)
- [ ] **Workflow flow diagram** (step-by-step)
- [ ] **Edge case handling** (what happens in each scenario)

## Example: Release Workflow Verification

### Problem

Release PRs are merged but releases aren't created because `skip-github-release: true` prevents tag creation.

### Solution Verification

#### 1. Research

**GitHub Actions `workflow_run` event:**

- Source: <https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_run>
- Verified: `github.event.workflow_run.head_sha` provides commit SHA ✅

**release-please-action behavior:**

- Source: <https://github.com/googleapis/release-please-action/blob/main/action.yml>
- Verified: `skip-github-release: true` prevents tag/release creation ✅

**GitHub API tag creation:**

- Source: <https://docs.github.com/en/rest/git/refs#create-a-reference>
- Verified: POST to `/repos/{owner}/{repo}/git/refs` creates tags ✅

#### 2. Test Commands

```bash
# Test git history detection
$ git log --grep="chore(main): release runi" --format="%H|%s" -n 50
13b939562e91066aa7f977fd08bc9ae0fbae6a47|chore(main): release runi 0.3.0 (#76)
✅ Successfully finds release PR merge commits

# Test version extraction
$ echo "chore(main): release runi 0.3.0 (#76)" | sed -nE 's/.*release runi ([0-9]+\.[0-9]+\.[0-9]+).*/\1/p'
0.3.0
✅ Correctly extracts version

# Test tag creation
$ gh api repos/paulbreuler/runi/git/refs -X POST \
  -f ref="refs/tags/test-tag" \
  -f sha="13b939562e91066aa7f977fd08bc9ae0fbae6a47"
{"ref":"refs/tags/test-tag",...}
✅ Tag creation works
```

#### 3. Verify Workflow Structure

- Job dependencies: `check-ci-status` → `release-please` → `create-tag` → `build` → `create-release` ✅
- All `needs` relationships correct ✅
- All outputs properly passed through ✅
- Permissions set correctly ✅

#### 4. Test Full Flow

```bash
# Test complete detection script
RELEASE_COMMITS=$(git log --grep="chore(main): release runi" --format="%H|%s" -n 50 | grep -E "...")
# Process commits, check tags, identify untagged releases
✅ Script logic works end-to-end
```

## Command Usage

When proposing a workflow solution, use this process:

1. **Research** authoritative sources first
2. **Test** all commands locally
3. **Verify** workflow structure
4. **Document** proof with test results

## Checklist Template

```markdown
## Verification Checklist

### Research

- [ ] GitHub Actions docs consulted
- [ ] Action documentation reviewed
- [ ] API documentation verified

### Testing

- [ ] Git commands tested
- [ ] Script logic tested
- [ ] API calls tested
- [ ] Edge cases tested

### Structure

- [ ] Job dependencies verified
- [ ] Conditionals verified
- [ ] Permissions verified
- [ ] Outputs verified

### Proof

- [ ] Test results documented
- [ ] Sources cited
- [ ] Flow diagram created
- [ ] Edge cases documented
```

## Key Principles

1. **Never assume** - Always verify against authoritative sources
2. **Test everything** - Run actual commands, don't just read docs
3. **Prove it works** - Show test results, not just theory
4. **Document proof** - Create evidence that can be reviewed
5. **Handle edge cases** - What happens when things go wrong?

## Related Commands

- `/code-review` - Review code changes
- `/pr-create` - Create pull request with verification
- `/pr-check-fixes` - Fix failing CI checks
