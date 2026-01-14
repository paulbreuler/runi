import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import MainLayout from './MainLayout.svelte';

describe('MainLayout', () => {
  beforeEach(() => {
    // Mock navigator for consistent keyboard shortcut testing
    vi.stubGlobal('navigator', {
      platform: 'MacIntel',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders with data-testid attribute', () => {
    render(MainLayout);
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders all three panels', () => {
    render(MainLayout);
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('request-pane')).toBeInTheDocument();
    expect(screen.getByTestId('response-pane')).toBeInTheDocument();
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('renders pane resizer', () => {
    render(MainLayout);
    expect(screen.getByTestId('pane-resizer')).toBeInTheDocument();
  });

  it('sidebar is visible by default', () => {
    render(MainLayout);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('hides sidebar when initialSidebarVisible is false', () => {
    render(MainLayout, { props: { initialSidebarVisible: false } });
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('toggles sidebar with Cmd+B keyboard shortcut on Mac', async () => {
    render(MainLayout);

    // Sidebar is initially visible
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();

    // Simulate Cmd+B on Mac
    await fireEvent.keyDown(window, { key: 'b', metaKey: true });

    // Sidebar should be hidden
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('toggles sidebar with Ctrl+B keyboard shortcut on Windows/Linux', async () => {
    // Mock navigator for Windows
    vi.stubGlobal('navigator', {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    render(MainLayout);

    // Sidebar is initially visible
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();

    // Simulate Ctrl+B on Windows
    await fireEvent.keyDown(window, { key: 'b', ctrlKey: true });

    // Sidebar should be hidden
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('has h-screen class for full viewport height', () => {
    render(MainLayout);
    const mainLayout = screen.getByTestId('main-layout');
    expect(mainLayout).toHaveClass('h-screen');
  });

  it('displays placeholder content when no snippets provided', () => {
    render(MainLayout);
    expect(screen.getByText(/Request Builder \(placeholder/)).toBeInTheDocument();
    expect(screen.getByText(/Response Viewer \(placeholder/)).toBeInTheDocument();
  });
});
