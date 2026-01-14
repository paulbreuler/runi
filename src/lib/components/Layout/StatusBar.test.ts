import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatusBar from './StatusBar.svelte';

describe('StatusBar', () => {
  it('renders with data-testid attribute', () => {
    render(StatusBar);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('displays environment indicator', () => {
    render(StatusBar);
    expect(screen.getByText('Environment:')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
  });

  it('displays AI hint text', () => {
    render(StatusBar);
    // Use a function matcher because the text is split across elements (kbd)
    expect(
      screen.getByText((_content, element) => {
        return (
          element?.tagName === 'SPAN' &&
          element.textContent !== null &&
          element.textContent.includes('for AI assistance')
        );
      })
    ).toBeInTheDocument();
    expect(screen.getByText('⌘I')).toBeInTheDocument();
  });

  it('uses monospaced font for environment value', () => {
    render(StatusBar);
    const envValue = screen.getByText('default');
    expect(envValue).toHaveClass('font-mono');
  });

  it('has correct styling classes', () => {
    render(StatusBar);
    const statusBar = screen.getByTestId('status-bar');
    expect(statusBar).toHaveClass('h-8');
    expect(statusBar).toHaveClass('border-t');
    expect(statusBar).toHaveClass('text-xs');
  });
});
