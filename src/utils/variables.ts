// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

/**
 * Replace `{{variableName}}` placeholders in a template string with values
 * from a variables record.
 *
 * Unknown variables (keys not present in `vars`) are left as-is so that
 * callers can detect unresolved references.
 *
 * Only word characters (\w+) are matched inside braces — hyphens and other
 * special characters are not valid variable name delimiters.
 */
export function resolveVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string): string => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return vars[key] ?? `{{${key}}}`;
    }
    return `{{${key}}}`;
  });
}
