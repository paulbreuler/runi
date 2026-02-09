/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as Select from '@/components/ui/select';
import { cn } from '@/utils/cn';
import { compositeFocusContainerClasses, compositeFocusItemClasses } from '@/utils/accessibility';
import { getMethodColor, type HttpMethod } from '@/utils/http-colors';

interface UrlBarProps {
  method: HttpMethod;
  url?: string;
  loading?: boolean;
  onMethodChange?: (method: HttpMethod) => void;
  onUrlChange?: (url: string) => void;
  onSend?: () => void;
}

/**
 * UrlBar - The main interaction bar for the application.
 * Currently handles Method selection, URL input, and Send action.
 * Future evolution will include intent detection and natural language commands.
 */
export const UrlBar = ({
  method,
  url = '',
  loading = false,
  onMethodChange,
  onUrlChange,
  onSend,
}: UrlBarProps): React.JSX.Element => {
  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  const isValidUrl = url.length > 0;
  const methodColor = getMethodColor(method);

  // Respect prefers-reduced-motion
  const shouldReduceMotion = useReducedMotion();

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
    if (shouldReduceMotion === true) {
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
        className={cn(
          'flex flex-1 min-w-0 items-center gap-0 overflow-hidden transition-all duration-300',
          compositeFocusContainerClasses
        )}
        data-test-id="url-bar"
      >
        {/* Method selector - appears as prefix */}
        <Select.Select value={method} onValueChange={handleMethodChange}>
          <Select.SelectTrigger
            role="button"
            aria-haspopup="listbox"
            className={cn(
              'relative min-w-24 w-auto h-7 font-mono text-xs font-semibold bg-transparent border-0 transition-all duration-300 whitespace-nowrap',
              compositeFocusItemClasses,
              methodColor,
              'hover:brightness-125 focus:brightness-125'
            )}
            data-test-id="method-select"
            disabled={loading}
            aria-label="HTTP Method"
          >
            <Select.SelectValue>{method}</Select.SelectValue>
          </Select.SelectTrigger>
          <Select.SelectContent className="glass">
            {httpMethods.map((httpMethod) => {
              const color = getMethodColor(httpMethod);
              return (
                <Select.SelectItem
                  key={httpMethod}
                  value={httpMethod}
                  className={cn('text-xs font-mono', color, 'data-highlighted:bg-bg-raised/50')}
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
          noScale
          className={cn(
            'relative h-7 flex-1 border-0 rounded-none bg-transparent text-text-primary font-mono text-sm placeholder:text-text-muted/40 py-0',
            compositeFocusItemClasses
          )}
        />

        {/* Send button - minimal suffix */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="xs"
            noScale
            onClick={onSend}
            disabled={!isValidUrl || loading}
            data-test-id="send-button"
            aria-label="Send Request"
            className={cn(
              'relative h-7 px-3 justify-center whitespace-nowrap text-text-muted hover:text-accent-blue transition-colors',
              compositeFocusItemClasses
            )}
          >
            {loading ? renderLoadingState() : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};
