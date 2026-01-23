/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  renderMethodOption,
  renderStatusOption,
  renderIntelligenceOption,
  type MethodSelectOption,
  type StatusSelectOption,
  type IntelligenceSelectOption,
} from './selectRenderers';

describe('selectRenderers', () => {
  describe('renderMethodOption', () => {
    it('renders ALL option as plain text', () => {
      const option: MethodSelectOption = { value: 'ALL', label: 'All Methods' };
      render(<>{renderMethodOption(option)}</>);

      expect(screen.getByText('All Methods')).toBeInTheDocument();
      expect(screen.getByText('All Methods')).toHaveClass('text-text-secondary');
    });

    it('renders GET with blue color', () => {
      const option: MethodSelectOption = { value: 'GET', label: 'GET' };
      render(<>{renderMethodOption(option)}</>);

      const badge = screen.getByText('GET');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-accent-blue');
    });

    it('renders POST with green color', () => {
      const option: MethodSelectOption = { value: 'POST', label: 'POST' };
      render(<>{renderMethodOption(option)}</>);

      const badge = screen.getByText('POST');
      expect(badge).toHaveClass('text-signal-success');
    });

    it('renders PUT with warning color', () => {
      const option: MethodSelectOption = { value: 'PUT', label: 'PUT' };
      render(<>{renderMethodOption(option)}</>);

      const badge = screen.getByText('PUT');
      expect(badge).toHaveClass('text-signal-warning');
    });

    it('renders DELETE with error color', () => {
      const option: MethodSelectOption = { value: 'DELETE', label: 'DELETE' };
      render(<>{renderMethodOption(option)}</>);

      const badge = screen.getByText('DELETE');
      expect(badge).toHaveClass('text-signal-error');
    });

    it('applies background color to method badges', () => {
      const option: MethodSelectOption = { value: 'GET', label: 'GET' };
      render(<>{renderMethodOption(option)}</>);

      const badge = screen.getByText('GET');
      expect(badge).toHaveClass('bg-accent-blue/10');
    });
  });

  describe('renderStatusOption', () => {
    it('renders All option as plain text', () => {
      const option: StatusSelectOption = { value: 'All', label: 'All Status' };
      render(<>{renderStatusOption(option)}</>);

      expect(screen.getByText('All Status')).toBeInTheDocument();
    });

    it('renders 2xx with success color and dot', () => {
      const option: StatusSelectOption = { value: '2xx', label: '2xx Success', range: '2xx' };
      render(<>{renderStatusOption(option)}</>);

      expect(screen.getByText('2xx Success')).toBeInTheDocument();
      expect(screen.getByText('2xx Success')).toHaveClass('text-signal-success');
    });

    it('renders 3xx with blue color and dot', () => {
      const option: StatusSelectOption = { value: '3xx', label: '3xx Redirect', range: '3xx' };
      render(<>{renderStatusOption(option)}</>);

      expect(screen.getByText('3xx Redirect')).toHaveClass('text-accent-blue');
    });

    it('renders 4xx with warning color and dot', () => {
      const option: StatusSelectOption = { value: '4xx', label: '4xx Client Error', range: '4xx' };
      render(<>{renderStatusOption(option)}</>);

      expect(screen.getByText('4xx Client Error')).toHaveClass('text-signal-warning');
    });

    it('renders 5xx with error color and dot', () => {
      const option: StatusSelectOption = { value: '5xx', label: '5xx Server Error', range: '5xx' };
      render(<>{renderStatusOption(option)}</>);

      expect(screen.getByText('5xx Server Error')).toHaveClass('text-signal-error');
    });

    it('renders colored dot indicator', () => {
      const option: StatusSelectOption = { value: '2xx', label: '2xx Success', range: '2xx' };
      const { container } = render(<>{renderStatusOption(option)}</>);

      // Find the dot element
      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('bg-signal-success');
    });
  });

  describe('renderIntelligenceOption', () => {
    it('renders All option as plain text', () => {
      const option: IntelligenceSelectOption = { value: 'All', label: 'All' };
      render(<>{renderIntelligenceOption(option)}</>);

      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('renders verified with success color and dot', () => {
      const option: IntelligenceSelectOption = {
        value: 'verified',
        label: 'Verified',
        signal: 'verified',
      };
      render(<>{renderIntelligenceOption(option)}</>);

      expect(screen.getByText('Verified')).toHaveClass('text-signal-success');
    });

    it('renders drift with warning color and dot', () => {
      const option: IntelligenceSelectOption = {
        value: 'drift',
        label: 'Has Drift',
        signal: 'drift',
      };
      render(<>{renderIntelligenceOption(option)}</>);

      expect(screen.getByText('Has Drift')).toHaveClass('text-signal-warning');
    });

    it('renders ai with AI signal color and dot', () => {
      const option: IntelligenceSelectOption = { value: 'ai', label: 'AI Generated', signal: 'ai' };
      render(<>{renderIntelligenceOption(option)}</>);

      expect(screen.getByText('AI Generated')).toHaveClass('text-signal-ai');
    });

    it('renders bound with blue color and dot', () => {
      const option: IntelligenceSelectOption = {
        value: 'bound',
        label: 'Bound to Spec',
        signal: 'bound',
      };
      render(<>{renderIntelligenceOption(option)}</>);

      expect(screen.getByText('Bound to Spec')).toHaveClass('text-accent-blue');
    });

    it('renders colored dot indicator', () => {
      const option: IntelligenceSelectOption = {
        value: 'drift',
        label: 'Has Drift',
        signal: 'drift',
      };
      const { container } = render(<>{renderIntelligenceOption(option)}</>);

      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('bg-signal-warning');
    });
  });
});
