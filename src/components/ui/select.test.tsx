/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import * as Select from './select';

describe('Select', () => {
  it('renders select with trigger and value', () => {
    render(
      <Select.Select defaultValue="apple">
        <Select.SelectTrigger data-test-id="select-trigger">
          <Select.SelectValue placeholder="Select a fruit" />
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="apple" data-test-id="select-item-apple">
            Apple
          </Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>
    );

    expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
    // Base UI renders the raw value when items prop is not used
    // The label "Apple" is only visible when the popup is open
    expect(screen.getByText('apple')).toBeInTheDocument();
  });

  it('opens popup when trigger is clicked', async () => {
    render(
      <Select.Select defaultValue="apple">
        <Select.SelectTrigger data-test-id="select-trigger">
          <Select.SelectValue placeholder="Select a fruit" />
        </Select.SelectTrigger>
        <Select.SelectContent data-test-id="select-content">
          <Select.SelectItem value="apple" data-test-id="select-item-apple">
            Apple
          </Select.SelectItem>
          <Select.SelectItem value="banana" data-test-id="select-item-banana">
            Banana
          </Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>
    );

    const trigger = screen.getByTestId('select-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('select-content')).toBeVisible();
    });
  });

  it('selects item when clicked', async () => {
    // Base UI Positioner uses pointer-events:none in jsdom; skip that check
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    const onValueChange = vi.fn();
    render(
      <Select.Select onValueChange={onValueChange}>
        <Select.SelectTrigger data-test-id="select-trigger">
          <Select.SelectValue placeholder="Select a fruit" />
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="apple" data-test-id="select-item-apple">
            Apple
          </Select.SelectItem>
          <Select.SelectItem value="banana" data-test-id="select-item-banana">
            Banana
          </Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>
    );

    const trigger = screen.getByTestId('select-trigger');
    await user.click(trigger);

    const bananaOption = await screen.findByTestId('select-item-banana');
    await user.click(bananaOption);

    await waitFor(() => {
      // Base UI onValueChange passes (value, eventDetails)
      expect(onValueChange).toHaveBeenCalled();
      expect(onValueChange).toHaveBeenCalledWith('banana', expect.any(Object));
    });
  });

  it('displays placeholder when no value is selected', () => {
    render(
      <Select.Select>
        <Select.SelectTrigger data-test-id="select-trigger">
          <Select.SelectValue placeholder="Select a fruit" />
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="apple">Apple</Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>
    );

    expect(screen.getByText('Select a fruit')).toBeInTheDocument();
  });

  it('supports disabled state', () => {
    render(
      <Select.Select disabled>
        <Select.SelectTrigger data-test-id="select-trigger">
          <Select.SelectValue placeholder="Select a fruit" />
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="apple">Apple</Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>
    );

    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toBeDisabled();
  });

  it('supports groups', async () => {
    render(
      <Select.Select defaultValue="apple">
        <Select.SelectTrigger data-test-id="select-trigger">
          <Select.SelectValue placeholder="Select a fruit" />
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectGroup>
            <Select.SelectLabel>Fruits</Select.SelectLabel>
            <Select.SelectItem value="apple">Apple</Select.SelectItem>
          </Select.SelectGroup>
        </Select.SelectContent>
      </Select.Select>
    );

    // Groups are only visible when the popup is open
    const trigger = screen.getByTestId('select-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Fruits')).toBeInTheDocument();
    });
  });
});
