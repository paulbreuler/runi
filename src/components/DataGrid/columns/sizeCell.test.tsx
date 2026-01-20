/**
 * @file SizeCell component tests
 * @description Tests for response size cell component
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SizeCell } from './sizeCell';

describe('SizeCell', () => {
  describe('bytes formatting', () => {
    it('renders bytes for values < 1KB', () => {
      render(<SizeCell bytes={0} />);
      expect(screen.getByText('0 B')).toBeInTheDocument();
    });

    it('renders bytes for small values', () => {
      render(<SizeCell bytes={500} />);
      expect(screen.getByText('500 B')).toBeInTheDocument();
    });

    it('renders bytes for values just under 1KB', () => {
      render(<SizeCell bytes={1023} />);
      expect(screen.getByText('1023 B')).toBeInTheDocument();
    });
  });

  describe('kilobytes formatting', () => {
    it('renders kilobytes for values >= 1KB', () => {
      render(<SizeCell bytes={1024} />);
      expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    });

    it('renders kilobytes with one decimal place', () => {
      render(<SizeCell bytes={2048} />);
      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    });

    it('renders kilobytes with fractional values', () => {
      render(<SizeCell bytes={1536} />);
      expect(screen.getByText('1.5 KB')).toBeInTheDocument();
    });

    it('renders kilobytes for values just under 1MB', () => {
      render(<SizeCell bytes={1048575} />);
      expect(screen.getByText('1024.0 KB')).toBeInTheDocument();
    });
  });

  describe('megabytes formatting', () => {
    it('renders megabytes for values >= 1MB', () => {
      render(<SizeCell bytes={1048576} />);
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });

    it('renders megabytes with one decimal place', () => {
      render(<SizeCell bytes={2097152} />);
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });

    it('renders megabytes with fractional values', () => {
      render(<SizeCell bytes={1572864} />);
      expect(screen.getByText('1.5 MB')).toBeInTheDocument();
    });

    it('renders large megabytes correctly', () => {
      render(<SizeCell bytes={1500000} />);
      expect(screen.getByText('1.4 MB')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('uses monospace font', () => {
      render(<SizeCell bytes={500} />);
      const element = screen.getByText('500 B');
      expect(element).toHaveClass('font-mono');
    });

    it('uses muted text color', () => {
      render(<SizeCell bytes={500} />);
      const element = screen.getByText('500 B');
      expect(element).toHaveClass('text-text-muted');
    });

    it('uses small text size', () => {
      render(<SizeCell bytes={500} />);
      const element = screen.getByText('500 B');
      expect(element).toHaveClass('text-xs');
    });
  });

  describe('title attribute', () => {
    it('has title attribute with raw byte count', () => {
      render(<SizeCell bytes={500} />);
      const element = screen.getByText('500 B');
      expect(element).toHaveAttribute('title', '500 bytes');
    });

    it('formats large byte counts with commas in title', () => {
      render(<SizeCell bytes={1500000} />);
      const element = screen.getByText('1.4 MB');
      expect(element).toHaveAttribute('title', '1,500,000 bytes');
    });
  });
});
