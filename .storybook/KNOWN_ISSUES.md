# Storybook Known Issues

## ✅ Resolved: Migration to storybook/test

**Status**: Resolved

**Previous Issue**: `@storybook/test@8.6.15` showed a peer dependency warning with Storybook 10.2.0 because it expected Storybook 8.6.15.

**Resolution**: Migrated all imports from `@storybook/test` to `storybook/test` (the official Storybook 10 approach). The test utilities are now provided directly by the `storybook` package as a subpath export.

**Changes Made**:

- ✅ Updated all story files (43 files) to use `from 'storybook/test'`
- ✅ Updated template files to use `from 'storybook/test'`
- ✅ Removed `@storybook/test` dependency from `package.json`
- ✅ Removed `overrides` section from `package.json` (no longer needed)
- ✅ Updated documentation and comments

**Current Status**:

- ✅ No version mismatch warnings
- ✅ All test utilities (`fn`, `expect`, `userEvent`, `within`) work correctly
- ✅ Storybook builds and runs without warnings
- ✅ All stories compile and run successfully

**References**:

- [Storybook 10 Testing Documentation](https://storybook.js.org/docs/writing-tests/introduction)
- [Storybook GitHub Issue #32836](https://github.com/storybookjs/storybook/issues/32836)
