/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const syntaxHighlightTheme = {
  ...oneDark,
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.875rem',
    lineHeight: '1.6',
  },
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'transparent',
    padding: 0,
    margin: 0,
  },
};

export const syntaxHighlightBaseStyle = {
  background: 'transparent',
  padding: 0,
  margin: 0,
  fontSize: '0.875rem',
  lineHeight: '1.6',
};

export const syntaxHighlightLineNumberStyle = {
  minWidth: '2.5em',
  paddingRight: '1em',
  color: 'var(--color-text-muted)',
  opacity: 0.5,
  userSelect: 'none' as const,
  WebkitUserSelect: 'none' as const,
  MozUserSelect: 'none' as const,
  msUserSelect: 'none' as const,
  pointerEvents: 'none' as const,
};

export const syntaxHighlightCodeTagStyle = {
  fontFamily: 'var(--font-mono)',
};
