import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Button from './Button.svelte';

describe('Button component', () => {
  describe('Rendering', () => {
    it('renders button with children', () => {
      render(Button, { children: () => 'Click me' });
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('applies default variant classes', () => {
      const { container } = render(Button, { children: () => 'Default' });
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-primary');
      expect(button?.className).toContain('text-primary-foreground');
    });

    it('applies destructive variant classes', () => {
      const { container } = render(Button, {
        variant: 'destructive',
        children: () => 'Delete',
      });
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-destructive');
      expect(button?.className).toContain('text-destructive-foreground');
    });

    it('applies outline variant classes', () => {
      const { container } = render(Button, {
        variant: 'outline',
        children: () => 'Outline',
      });
      const button = container.querySelector('button');
      expect(button?.className).toContain('border');
      expect(button?.className).toContain('border-input');
    });

    it('applies secondary variant classes', () => {
      const { container } = render(Button, {
        variant: 'secondary',
        children: () => 'Secondary',
      });
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-secondary');
      expect(button?.className).toContain('text-secondary-foreground');
    });

    it('applies ghost variant classes', () => {
      const { container } = render(Button, {
        variant: 'ghost',
        children: () => 'Ghost',
      });
      const button = container.querySelector('button');
      expect(button?.className).toContain('hover:bg-accent');
    });

    it('applies link variant classes', () => {
      const { container } = render(Button, {
        variant: 'link',
        children: () => 'Link',
      });
      const button = container.querySelector('button');
      expect(button?.className).toContain('text-primary');
      expect(button?.className).toContain('underline-offset-4');
    });

    it('applies small size classes', () => {
      const { container } = render(Button, {
        size: 'sm',
        children: () => 'Small',
      });
      const button = container.querySelector('button');
      expect(button?.className).toContain('h-8');
      expect(button?.className).toContain('text-xs');
    });

    it('applies large size classes', () => {
      const { container } = render(Button, {
        size: 'lg',
        children: () => 'Large',
      });
      const button = container.querySelector('button');
      expect(button?.className).toContain('h-10');
    });

    it('applies icon size classes', () => {
      const { container } = render(Button, {
        size: 'icon',
        children: () => 'Icon',
      });
      const button = container.querySelector('button');
      expect(button?.className).toContain('h-9');
      expect(button?.className).toContain('w-9');
    });

    it('merges custom className', () => {
      const { container } = render(Button, {
        class: 'custom-class',
        children: () => 'Custom',
      });
      const button = container.querySelector('button');
      expect(button?.className).toContain('custom-class');
    });
  });

  describe('Interactions', () => {
    it('calls onclick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(Button, {
        onclick: handleClick,
        children: () => 'Click me',
      });

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
      render(Button, {
        disabled: true,
        children: () => 'Disabled',
      });
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.className).toContain('disabled:opacity-50');
    });

    it('does not call onclick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(Button, {
        disabled: true,
        onclick: handleClick,
        children: () => 'Disabled',
      });

      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('passes through aria-label', () => {
      render(Button, {
        'aria-label': 'Submit form',
        children: () => 'Submit',
      });
      expect(screen.getByRole('button', { name: 'Submit form' })).toBeInTheDocument();
    });

    it('passes through data attributes', () => {
      const { container } = render(Button, {
        'data-testid': 'submit-button',
        children: () => 'Submit',
      });
      expect(container.querySelector('[data-testid="submit-button"]')).toBeInTheDocument();
    });
  });

  describe('buttonVariants export', () => {
    it('exports buttonVariants function', async () => {
      const module = await import('./Button.svelte');
      expect(module.buttonVariants).toBeDefined();
      expect(typeof module.buttonVariants).toBe('function');
    });

    it('generates correct classes for variants', async () => {
      const module = await import('./Button.svelte');
      const defaultClasses = module.buttonVariants({ variant: 'default', size: 'default' });
      expect(defaultClasses).toContain('bg-primary');
      expect(defaultClasses).toContain('text-primary-foreground');
    });
  });
});
