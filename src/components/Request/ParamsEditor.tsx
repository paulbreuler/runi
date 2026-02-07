/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { useRequestStore } from '@/stores/useRequestStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

/**
 * ParamsEditor component for managing URL query parameters.
 */
export const ParamsEditor = (): React.JSX.Element => {
  const { url, setUrl } = useRequestStore();
  const [params, setParams] = useState<Array<{ key: string; value: string }>>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const shouldReduceMotion = useReducedMotion();

  const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };
  const transition = shouldReduceMotion === true ? { duration: 0.1 } : springTransition;

  // Parse URL to extract query parameters
  useEffect(() => {
    try {
      const urlObj = new URL(url);
      const parsedParams: Array<{ key: string; value: string }> = [];
      urlObj.searchParams.forEach((value, key) => {
        parsedParams.push({ key, value });
      });
      setParams(parsedParams);
    } catch {
      setParams([]);
    }
  }, [url]);

  // Update URL when params change
  const updateUrl = (newParams: Array<{ key: string; value: string }>): void => {
    try {
      const urlObj = new URL(url);
      urlObj.search = '';
      newParams.forEach(({ key, value }) => {
        if (key.trim().length > 0) {
          urlObj.searchParams.append(key.trim(), value.trim());
        }
      });
      setUrl(urlObj.toString());
    } catch {
      // Invalid URL, don't update
    }
  };

  const handleAddParam = (): void => {
    setEditingIndex(-1);
    setNewKey('');
    setNewValue('');
  };

  const handleSaveParam = (): void => {
    const updatedParams = [...params];
    if (editingIndex === -1) {
      // New param
      if (newKey.trim().length > 0) {
        updatedParams.push({ key: newKey.trim(), value: newValue.trim() });
      }
    } else if (editingIndex !== null) {
      // Edit existing
      updatedParams[editingIndex] = { key: newKey.trim(), value: newValue.trim() };
    }
    updateUrl(updatedParams);
    setEditingIndex(null);
    setNewKey('');
    setNewValue('');
  };

  const handleCancelEdit = (): void => {
    setEditingIndex(null);
    setNewKey('');
    setNewValue('');
  };

  const handleEditParam = (index: number): void => {
    const param = params[index];
    if (param === undefined) {
      return;
    }
    setEditingIndex(index);
    setNewKey(param.key);
    setNewValue(param.value);
  };

  const handleRemoveParam = (index: number): void => {
    const updatedParams = params.filter((_, i) => i !== index);
    updateUrl(updatedParams);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveParam();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="h-full flex flex-col" data-test-id="params-editor">
      <div className="flex-1 overflow-auto p-4" style={{ scrollbarGutter: 'stable' }}>
        {params.length === 0 && editingIndex === null && (
          <EmptyState
            variant="muted"
            title="No query parameters"
            description="Add parameters to append to the URL"
          />
        )}

        <div className="space-y-2">
          {params.map((param, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={transition}
              className="flex items-center gap-2 group"
            >
              {editingIndex === index ? (
                <>
                  <Input
                    value={newKey}
                    onChange={(e) => {
                      setNewKey(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Parameter name"
                    className="flex-1 font-mono text-sm"
                    autoFocus
                    data-test-id={`param-key-input-${String(index)}`}
                    aria-label="Parameter name"
                  />
                  <span className="text-text-muted">=</span>
                  <Input
                    value={newValue}
                    onChange={(e) => {
                      setNewValue(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Parameter value"
                    className="flex-1 font-mono text-sm"
                    data-test-id={`param-value-input-${String(index)}`}
                    aria-label="Parameter value"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleSaveParam}
                    className="text-signal-success hover:text-signal-success hover:bg-signal-success/10"
                    data-test-id="save-param-button"
                    aria-label="Save parameter"
                  >
                    <X className="rotate-45" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCancelEdit}
                    className="text-text-muted hover:text-text-primary"
                    data-test-id="cancel-param-button"
                    aria-label="Cancel editing"
                  >
                    <X />
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-raised border border-border-subtle hover:border-border-default transition-colors cursor-pointer',
                      focusRingClasses
                    )}
                    onClick={() => {
                      handleEditParam(index);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleEditParam(index);
                      }
                    }}
                    data-test-id={`param-row-${String(index)}`}
                    aria-label={`Edit ${param.key} parameter`}
                  >
                    <span className="text-accent-blue font-mono text-sm font-medium">
                      {param.key}
                    </span>
                    <span className="text-text-muted">=</span>
                    <span className="text-text-secondary font-mono text-sm flex-1 truncate">
                      {param.value}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      handleRemoveParam(index);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-signal-error hover:text-signal-error hover:bg-signal-error/10"
                    data-test-id={`remove-param-${String(index)}`}
                    aria-label={`Remove ${param.key} parameter`}
                  >
                    <X />
                  </Button>
                </>
              )}
            </motion.div>
          ))}

          {editingIndex === -1 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={transition}
              className="flex items-center gap-2"
            >
              <Input
                value={newKey}
                onChange={(e) => {
                  setNewKey(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Parameter name"
                className="flex-1 font-mono text-sm"
                autoFocus
                data-test-id="new-param-key-input"
                aria-label="New parameter name"
              />
              <span className="text-text-muted">=</span>
              <Input
                value={newValue}
                onChange={(e) => {
                  setNewValue(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Parameter value"
                className="flex-1 font-mono text-sm"
                data-test-id="new-param-value-input"
                aria-label="New parameter value"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSaveParam}
                className="text-signal-success hover:text-signal-success hover:bg-signal-success/10"
                data-test-id="save-new-param-button"
                aria-label="Save new parameter"
              >
                <X className="rotate-45" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCancelEdit}
                className="text-text-muted hover:text-text-primary"
                data-test-id="cancel-new-param-button"
                aria-label="Cancel new parameter"
              >
                <X />
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {editingIndex === null && (
        <div className="border-t border-border-subtle p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddParam}
            className="w-full"
            data-test-id="add-param-button"
          >
            <Plus className="size-4" />
            Add Parameter
          </Button>
        </div>
      )}
    </div>
  );
};
