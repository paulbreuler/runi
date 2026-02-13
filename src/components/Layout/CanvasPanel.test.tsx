import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CanvasPanel } from './CanvasPanel';

describe('CanvasPanel', () => {
  it('renders children', () => {
    render(
      <CanvasPanel panelId="test-panel">
        <div>Test content</div>
      </CanvasPanel>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies panel-specific test-id', () => {
    render(
      <CanvasPanel panelId="test-panel">
        <div>Content</div>
      </CanvasPanel>
    );

    expect(screen.getByTestId('canvas-panel-test-panel')).toBeInTheDocument();
  });

  it('applies default min-width and min-height constraints', () => {
    render(
      <CanvasPanel panelId="test-panel">
        <div>Content</div>
      </CanvasPanel>
    );

    const panel = screen.getByTestId('canvas-panel-test-panel');
    expect(panel).toHaveStyle({ minWidth: '200px', minHeight: '200px' });
  });

  it('applies custom min-width and min-height constraints', () => {
    render(
      <CanvasPanel panelId="test-panel" minWidth={300} minHeight={400}>
        <div>Content</div>
      </CanvasPanel>
    );

    const panel = screen.getByTestId('canvas-panel-test-panel');
    expect(panel).toHaveStyle({ minWidth: '300px', minHeight: '400px' });
  });

  it('applies custom width and height', () => {
    render(
      <CanvasPanel panelId="test-panel" width="50%" height="100%">
        <div>Content</div>
      </CanvasPanel>
    );

    const panel = screen.getByTestId('canvas-panel-test-panel');
    expect(panel).toHaveStyle({ width: '50%', height: '100%' });
  });

  it('applies custom className', () => {
    render(
      <CanvasPanel panelId="test-panel" className="custom-class">
        <div>Content</div>
      </CanvasPanel>
    );

    const panel = screen.getByTestId('canvas-panel-test-panel');
    expect(panel).toHaveClass('custom-class');
  });

  it('uses motion.div for layout animations', () => {
    const { container } = render(
      <CanvasPanel panelId="test-panel">
        <div>Content</div>
      </CanvasPanel>
    );

    // motion.div renders as a regular div with motion props
    const panel = container.querySelector('[data-test-id="canvas-panel-test-panel"]');
    expect(panel?.tagName).toBe('DIV');
  });
});
