/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file LanguageTabs component tests
 * @description Tests for the LanguageTabs component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LanguageTabs } from './LanguageTabs';
import type { CodeLanguage } from '@/utils/codeGenerators';

describe('LanguageTabs', () => {
  const languages: CodeLanguage[] = ['javascript', 'python', 'go'];

  it('renders all language tabs', () => {
    render(
      <LanguageTabs languages={languages} activeLanguage="javascript" onLanguageChange={vi.fn()} />
    );

    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
  });

  it('highlights active language tab', () => {
    render(
      <LanguageTabs languages={languages} activeLanguage="python" onLanguageChange={vi.fn()} />
    );

    const pythonTab = screen.getByText('Python').closest('button');
    expect(pythonTab).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onLanguageChange when tab is clicked', async () => {
    const user = userEvent.setup();
    const onLanguageChange = vi.fn();

    render(
      <LanguageTabs
        languages={languages}
        activeLanguage="javascript"
        onLanguageChange={onLanguageChange}
      />
    );

    const pythonTab = screen.getByText('Python');
    await user.click(pythonTab);

    expect(onLanguageChange).toHaveBeenCalledWith('python');
  });

  it('supports keyboard navigation with arrow keys', async () => {
    const user = userEvent.setup();
    const onLanguageChange = vi.fn();
    const { rerender } = render(
      <LanguageTabs
        languages={languages}
        activeLanguage="javascript"
        onLanguageChange={onLanguageChange}
      />
    );

    const javascriptTab = screen.getByText('JavaScript');
    javascriptTab.focus();

    await user.keyboard('{ArrowRight}');
    expect(onLanguageChange).toHaveBeenCalledWith('python');

    // Update to python and test left arrow
    onLanguageChange.mockClear();
    rerender(
      <LanguageTabs
        languages={languages}
        activeLanguage="python"
        onLanguageChange={onLanguageChange}
      />
    );
    const pythonTab = screen.getAllByText('Python')[0]!;
    pythonTab.focus();

    await user.keyboard('{ArrowLeft}');
    expect(onLanguageChange).toHaveBeenCalledWith('javascript');
  });

  it('wraps around with arrow keys', async () => {
    const user = userEvent.setup();
    const onLanguageChange = vi.fn();

    render(
      <LanguageTabs languages={languages} activeLanguage="go" onLanguageChange={onLanguageChange} />
    );

    const goTab = screen.getByText('Go');
    goTab.focus();

    await user.keyboard('{ArrowRight}');
    expect(onLanguageChange).toHaveBeenCalledWith('javascript');
  });

  it('has proper ARIA attributes', () => {
    render(
      <LanguageTabs languages={languages} activeLanguage="javascript" onLanguageChange={vi.fn()} />
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Code generation languages');

    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab, index) => {
      const language = languages[index];
      expect(tab).toHaveAttribute('aria-selected', index === 0 ? 'true' : 'false');
      if (language !== undefined) {
        expect(tab).toHaveAttribute('aria-controls', `code-panel-${language}`);
      }
    });
  });
});
