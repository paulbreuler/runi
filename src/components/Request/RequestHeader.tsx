/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as Select from '@/components/ui/select';
import { getMethodColor, type HttpMethod } from '@/utils/http-colors';

interface RequestHeaderProps {
  method: HttpMethod;
  url?: string;
  loading?: boolean;
  onMethodChange?: (method: HttpMethod) => void;
  onUrlChange?: (url: string) => void;
  onSend?: () => void;
}

export const RequestHeader = ({
  method,
  url = '',
  loading = false,
  onMethodChange,
  onUrlChange,
  onSend,
}: RequestHeaderProps): React.JSX.Element => {
  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  const isValidUrl = url.length > 0;
  const methodColor = getMethodColor(method);

  // Respect prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent): void => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return (): void => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const handleMethodChange = (value: string | null): void => {
    if (value !== null && value.length > 0 && onMethodChange !== undefined) {
      onMethodChange(value as HttpMethod);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !loading && isValidUrl && onSend !== undefined) {
      onSend();
    }
  };

  // Helper function to render loading state
  const renderLoadingState = (): React.JSX.Element => {
    if (prefersReducedMotion) {
      return <span className="text-accent-blue">Sending</span>;
    }
    return (
      <motion.span
        className="inline-block"
        style={{
          backgroundImage:
            'linear-gradient(90deg, var(--color-text-muted) 0%, var(--color-text-muted) 20%, var(--color-accent-blue) 40%, var(--color-accent-blue) 60%, var(--color-text-muted) 80%, var(--color-text-muted) 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          backgroundSize: '300% 100%',
          willChange: 'background-position',
        }}
        animate={{
          backgroundPosition: ['300% 0%', '-300% 0%'],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        aria-hidden="false"
      >
        Sending
      </motion.span>
    );
  };

  return (
    <div className="flex flex-1 min-w-0 items-center gap-0">
      {/* Inline titlebar command row (no extra panel shell) */}
      <div
        className="flex flex-1 min-w-0 items-center gap-0 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden transition-colors duration-200 hover:border-border-default focus-within:border-border-emphasis"
        data-test-id="request-control"
      >
        {/* Method selector - appears as prefix */}
        <Select.Select value={method} onValueChange={handleMethodChange}>
          <Select.SelectTrigger
            role="button"
            aria-haspopup="listbox"
            className={`min-w-28 w-auto h-8 font-semibold bg-transparent border-0 border-r border-border-subtle rounded-none rounded-l-lg hover:bg-bg-raised/50 transition-colors duration-200 whitespace-nowrap text-text-secondary ${methodColor}`}
            data-test-id="method-select"
            disabled={loading}
            aria-label="HTTP Method"
          >
            <Select.SelectValue>{method}</Select.SelectValue>
          </Select.SelectTrigger>
          <Select.SelectContent>
            {httpMethods.map((httpMethod) => {
              const color = getMethodColor(httpMethod);
              return (
                <Select.SelectItem
                  key={httpMethod}
                  value={httpMethod}
                  className={`${color} data-highlighted:bg-bg-raised/50`}
                >
                  {httpMethod}
                </Select.SelectItem>
              );
            })}
          </Select.SelectContent>
        </Select.Select>

        {/* URL input - seamless flow */}
        <Input
          type="text"
          value={url}
          onChange={(e) => onUrlChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter request URL..."
          data-test-id="url-input"
          disabled={loading}
          aria-label="Request URL"
          className="h-8 flex-1 border-0 rounded-none bg-transparent text-text-secondary placeholder:text-text-muted"
        />

        {/* Send button - appears as suffix with fixed width to prevent layout shift */}
        <div className="flex-shrink-0 w-[72px] border-l border-border-subtle">
          <Button
            variant="ghost"
            size="sm"
            noScale
            onClick={onSend}
            disabled={!isValidUrl || loading}
            data-test-id="send-button"
            aria-label="Send Request"
            className="w-full justify-center whitespace-nowrap hover:text-accent-blue !px-2"
            style={{ minWidth: '72px' }}
          >
            {loading ? renderLoadingState() : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};
