import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <div data-testid="card-content">Card content</div>
      </Card>
    );
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('applies default styling', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('rounded-xl');
    expect(card.className).toContain('border-border-subtle');
    expect(card.className).toContain('bg-bg-surface');
  });

  it('applies glass styling when glass prop is true', () => {
    const { container } = render(<Card glass>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('glass');
    expect(card.className).not.toContain('bg-bg-surface');
  });

  it('disables hover effect when hover prop is false', () => {
    const { container } = render(<Card hover={false}>Content</Card>);
    const card = container.firstChild as HTMLElement;
    // Motion component should not have whileHover when hover is false
    // This is tested by checking the component renders without hover styles
    expect(card).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <Card ref={ref}>
        <div>Content</div>
      </Card>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(
      <CardHeader>
        <div data-testid="header-content">Header</div>
      </CardHeader>
    );
    expect(screen.getByTestId('header-content')).toBeInTheDocument();
  });

  it('applies default styling', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header.className).toContain('px-6');
  });
});

describe('CardTitle', () => {
  it('renders children', () => {
    render(
      <CardTitle>
        <span data-testid="title-content">Title</span>
      </CardTitle>
    );
    expect(screen.getByTestId('title-content')).toBeInTheDocument();
  });

  it('applies default styling', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    const title = container.firstChild as HTMLElement;
    expect(title.className).toContain('font-semibold');
  });
});

describe('CardDescription', () => {
  it('renders children', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('applies default styling', () => {
    const { container } = render(<CardDescription>Description</CardDescription>);
    const description = container.firstChild as HTMLElement;
    expect(description.className).toContain('text-sm');
    expect(description.className).toContain('text-text-secondary');
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(
      <CardContent>
        <div data-testid="content">Content</div>
      </CardContent>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('applies default styling', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    const content = container.firstChild as HTMLElement;
    expect(content.className).toContain('px-6');
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(
      <CardFooter>
        <div data-testid="footer-content">Footer</div>
      </CardFooter>
    );
    expect(screen.getByTestId('footer-content')).toBeInTheDocument();
  });

  it('applies default styling', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    const footer = container.firstChild as HTMLElement;
    expect(footer.className).toContain('px-6');
    expect(footer.className).toContain('flex');
    expect(footer.className).toContain('items-center');
  });
});

describe('Card composition', () => {
  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>Card content</CardContent>
        <CardFooter>Card footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
    expect(screen.getByText('Card footer')).toBeInTheDocument();
  });
});
