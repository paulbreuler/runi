import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { BodyEditor } from './BodyEditor';
import { useRequestStore } from '@/stores/useRequestStore';

describe('BodyEditor', () => {
  afterEach(() => {
    act(() => {
      useRequestStore.getState().reset();
    });
    cleanup();
  });

  it('renders the syntax layer and textarea', () => {
    act(() => {
      useRequestStore.setState({ body: '{"name":"Runi"}' });
    });
    render(<BodyEditor />);

    expect(screen.getByTestId('body-syntax-layer')).toBeInTheDocument();
    const textarea = screen.getByTestId('body-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('{"name":"Runi"}');
  });

  it('uses JSON highlighting when the body is valid JSON', () => {
    act(() => {
      useRequestStore.setState({ body: '{"valid":true}' });
    });
    render(<BodyEditor />);

    expect(screen.getByTestId('body-syntax-layer')).toBeInTheDocument();
    expect(screen.getByTestId('body-syntax-layer').querySelector('[data-language="json"]')).toBeTruthy();
    expect(screen.getByText('Valid JSON')).toBeInTheDocument();
  });

  it('falls back to text highlighting when JSON is invalid', () => {
    act(() => {
      useRequestStore.setState({ body: '{invalid-json' });
    });
    render(<BodyEditor />);

    expect(screen.getByTestId('body-syntax-layer')).toBeInTheDocument();
    expect(screen.getByTestId('body-syntax-layer').querySelector('[data-language="text"]')).toBeTruthy();
    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
  });

  it('supports XML highlighting when XML-like content is provided', () => {
    act(() => {
      useRequestStore.setState({ body: '<note><to>Runi</to></note>' });
    });
    render(<BodyEditor />);

    expect(screen.getByTestId('body-syntax-layer')).toBeInTheDocument();
    expect(screen.getByTestId('body-syntax-layer').querySelector('[data-language="xml"]')).toBeTruthy();
    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
  });

  it('updates the store when the user types', async () => {
    render(<BodyEditor />);

    const textarea = screen.getByTestId('body-textarea');
    act(() => {
      fireEvent.change(textarea, { target: { value: '{"typed":true}' } });
    });

    expect(useRequestStore.getState().body).toBe('{"typed":true}');
  });
});
