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

      const el = screen.getByTestId('method-option-all');
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass('text-text-secondary');
    });

    it('renders GET with method-specific color', () => {
      const option: MethodSelectOption = { value: 'GET', label: 'GET' };
      render(<>{renderMethodOption(option)}</>);

      const badge = screen.getByTestId('method-option-GET');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('text-method-get');
    });

    it('renders POST with method-specific color', () => {
      const option: MethodSelectOption = { value: 'POST', label: 'POST' };
      render(<>{renderMethodOption(option)}</>);

      const badge = screen.getByTestId('method-option-POST');
      expect(badge).toHaveClass('text-method-post');
    });

    it('renders PUT with method-specific color', () => {
      const option: MethodSelectOption = { value: 'PUT', label: 'PUT' };
      render(<>{renderMethodOption(option)}</>);

      const badge = screen.getByTestId('method-option-PUT');
      expect(badge).toHaveClass('text-method-put');
    });

    it('renders DELETE with method-specific color', () => {
      const option: MethodSelectOption = { value: 'DELETE', label: 'DELETE' };
      render(<>{renderMethodOption(option)}</>);

      const badge = screen.getByTestId('method-option-DELETE');
      expect(badge).toHaveClass('text-method-delete');
    });

    it('applies background color to method badges', () => {
      const option: MethodSelectOption = { value: 'GET', label: 'GET' };
      render(<>{renderMethodOption(option)}</>);

      const badge = screen.getByTestId('method-option-GET');
      expect(badge).toHaveClass('bg-accent-blue/10');
    });
  });

  describe('renderStatusOption', () => {
    it('renders All option as plain text', () => {
      const option: StatusSelectOption = { value: 'All', label: 'All Status' };
      render(<>{renderStatusOption(option)}</>);

      expect(screen.getByTestId('status-option-all')).toBeInTheDocument();
    });

    it('renders 2xx with success color and dot', () => {
      const option: StatusSelectOption = { value: '2xx', label: '2xx Success', range: '2xx' };
      render(<>{renderStatusOption(option)}</>);

      const container = screen.getByTestId('status-option-2xx');
      expect(container.querySelector('.text-signal-success')).toBeInTheDocument();
    });

    it('renders 3xx with blue color and dot', () => {
      const option: StatusSelectOption = { value: '3xx', label: '3xx Redirect', range: '3xx' };
      render(<>{renderStatusOption(option)}</>);

      const container = screen.getByTestId('status-option-3xx');
      expect(container.querySelector('.text-accent-blue')).toBeInTheDocument();
    });

    it('renders 4xx with warning color and dot', () => {
      const option: StatusSelectOption = { value: '4xx', label: '4xx Client Error', range: '4xx' };
      render(<>{renderStatusOption(option)}</>);

      const container = screen.getByTestId('status-option-4xx');
      expect(container.querySelector('.text-signal-warning')).toBeInTheDocument();
    });

    it('renders 5xx with error color and dot', () => {
      const option: StatusSelectOption = { value: '5xx', label: '5xx Server Error', range: '5xx' };
      render(<>{renderStatusOption(option)}</>);

      const container = screen.getByTestId('status-option-5xx');
      expect(container.querySelector('.text-signal-error')).toBeInTheDocument();
    });

    it('renders colored dot indicator', () => {
      const option: StatusSelectOption = { value: '2xx', label: '2xx Success', range: '2xx' };
      render(<>{renderStatusOption(option)}</>);

      const container = screen.getByTestId('status-option-2xx');
      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('bg-signal-success');
    });
  });

  describe('renderIntelligenceOption', () => {
    it('renders All option as plain text', () => {
      const option: IntelligenceSelectOption = { value: 'All', label: 'All' };
      render(<>{renderIntelligenceOption(option)}</>);

      expect(screen.getByTestId('intelligence-option-all')).toBeInTheDocument();
    });

    it('renders verified with success color and dot', () => {
      const option: IntelligenceSelectOption = {
        value: 'verified',
        label: 'Verified',
        signal: 'verified',
      };
      render(<>{renderIntelligenceOption(option)}</>);

      const container = screen.getByTestId('intelligence-option-verified');
      expect(container.querySelector('.text-signal-success')).toBeInTheDocument();
    });

    it('renders drift with warning color and dot', () => {
      const option: IntelligenceSelectOption = {
        value: 'drift',
        label: 'Has Drift',
        signal: 'drift',
      };
      render(<>{renderIntelligenceOption(option)}</>);

      const container = screen.getByTestId('intelligence-option-drift');
      expect(container.querySelector('.text-signal-warning')).toBeInTheDocument();
    });

    it('renders ai with AI signal color and dot', () => {
      const option: IntelligenceSelectOption = { value: 'ai', label: 'AI Generated', signal: 'ai' };
      render(<>{renderIntelligenceOption(option)}</>);

      const container = screen.getByTestId('intelligence-option-ai');
      expect(container.querySelector('.text-signal-ai')).toBeInTheDocument();
    });

    it('renders bound with blue color and dot', () => {
      const option: IntelligenceSelectOption = {
        value: 'bound',
        label: 'Bound to Spec',
        signal: 'bound',
      };
      render(<>{renderIntelligenceOption(option)}</>);

      const container = screen.getByTestId('intelligence-option-bound');
      expect(container.querySelector('.text-accent-blue')).toBeInTheDocument();
    });

    it('renders colored dot indicator', () => {
      const option: IntelligenceSelectOption = {
        value: 'drift',
        label: 'Has Drift',
        signal: 'drift',
      };
      render(<>{renderIntelligenceOption(option)}</>);

      const container = screen.getByTestId('intelligence-option-drift');
      const dot = container.querySelector('.rounded-full');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('bg-signal-warning');
    });
  });
});
