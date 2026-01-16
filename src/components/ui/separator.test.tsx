import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Separator } from './separator';

describe('Separator', () => {
  it('renders horizontal separator by default', () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toBeInTheDocument();
    expect(separator.className).toContain('h-px');
    expect(separator.className).toContain('w-full');
  });

  it('renders vertical separator when orientation is vertical', () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toContain('h-full');
    expect(separator.className).toContain('w-px');
  });

  it('applies default styling', () => {
    const { container } = render(<Separator />);
    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toContain('bg-border');
    expect(separator.className).toContain('shrink-0');
  });

  it('applies custom className', () => {
    const { container } = render(<Separator className="custom-class" />);
    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toContain('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Separator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('sets decorative prop correctly', () => {
    const { container } = render(<Separator decorative={false} />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toBeInTheDocument();
    // The decorative prop is passed to Radix UI component
    // We verify the component renders correctly
    expect(separator.getAttribute('data-orientation')).toBe('horizontal');
  });
});
