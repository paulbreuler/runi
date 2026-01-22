# Storybook Known Issues

## Version Compatibility Warning: @storybook/test

**Status**: Known limitation, non-blocking

**Issue**: `@storybook/test@8.6.15` shows a peer dependency warning with Storybook 10.2.0 because it expects Storybook 8.6.15.

**Impact**: None - the package works correctly despite the warning. All test utilities (`fn`, `expect`, `userEvent`, `within`) function properly.

**Why**: There is no version 10 of `@storybook/test` published yet. The package is maintained separately and the version mismatch is a peer dependency check, not a runtime incompatibility.

**Workaround**: An `overrides` entry in `package.json` attempts to suppress the warning, but `storybook doctor` may still report it.

**Resolution**: Wait for `@storybook/test` to release a version 10, or migrate to using test utilities directly from Vitest when using the Vitest addon.

**Verification**:

- ✅ Storybook builds successfully
- ✅ Storybook starts and serves stories
- ✅ Test utilities import and function correctly
- ✅ All stories using `@storybook/test` compile without errors

**References**:

- [Storybook GitHub Issue #32836](https://github.com/storybookjs/storybook/issues/32836)
