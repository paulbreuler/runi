/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { HomePage } from './index';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { requestContextDescriptor } from '@/contexts/RequestContext';

describe('HomePage - Context Registration Timing (Feature #1)', () => {
  beforeEach(() => {
    // Reset store before each test
    useCanvasStore.setState({
      contexts: new Map(),
      templates: new Map(),
      contextOrder: [],
      activeContextId: null,
      contextState: new Map(),
    });
  });

  it('registers template before useContextSync', () => {
    render(<HomePage />);

    const state = useCanvasStore.getState();

    // Template should be registered in templates Map
    expect(state.templates.has('request')).toBe(true);
    expect(state.templates.get('request')).toEqual(requestContextDescriptor);

    // Template should NOT be in contexts
    expect(state.contexts.has('request')).toBe(false);

    // Active context should be a request tab (created by useContextSync)
    expect(state.activeContextId).toMatch(/^request-/);
  });

  it('request tabs inherit layouts from template', () => {
    render(<HomePage />);

    const state = useCanvasStore.getState();
    const template = state.templates.get('request');

    // Template should have layouts defined
    expect(template).toBeDefined();
    expect(template?.layouts).toBeDefined();
    expect(template?.layouts.length).toBeGreaterThan(0);

    // Open a new request tab
    state.openRequestTab();

    // New request tab should inherit layouts from template
    const requestTabId = state.contextOrder.find((id) => id.startsWith('request-'));
    expect(requestTabId).toBeDefined();

    const requestTab = state.contexts.get(requestTabId!);
    expect(requestTab).toBeDefined();
    expect(requestTab?.layouts).toEqual(template?.layouts);
  });

  it('app renders without context not found error', () => {
    const { container } = render(<HomePage />);

    // Should not show error messages
    expect(container.textContent).not.toContain('Context not found');
    expect(container.textContent).not.toContain('No active context');
  });
});
