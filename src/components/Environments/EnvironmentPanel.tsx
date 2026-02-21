// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { focusRingClasses } from '@/utils/accessibility';
import { cn } from '@/utils/cn';

export interface EnvironmentPanelProps {
  collectionId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Panel for managing collection environments — create, delete, and edit
 * key-value variable tables per environment.
 */
export const EnvironmentPanel = ({
  collectionId,
  open,
  onClose,
}: EnvironmentPanelProps): React.JSX.Element | null => {
  const collection = useCollectionStore((state) =>
    state.collections.find((c) => c.id === collectionId)
  );
  const { upsertEnvironment, deleteEnvironment } = useCollectionStore();

  const [expandedEnv, setExpandedEnv] = useState<string | null>(null);
  const [isAddingEnv, setIsAddingEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');

  // Track edited variable values per environment
  const [editedVars, setEditedVars] = useState<Record<string, Record<string, string>>>({});

  const newEnvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingEnv && newEnvInputRef.current !== null) {
      newEnvInputRef.current.focus();
    }
  }, [isAddingEnv]);

  if (!open) {
    return null;
  }

  const environments = collection?.environments ?? [];

  const handleDeleteEnvironment = async (name: string): Promise<void> => {
    await deleteEnvironment(collectionId, name);
    if (expandedEnv === name) {
      setExpandedEnv(null);
    }
  };

  const handleAddEnvironment = async (): Promise<void> => {
    const trimmed = newEnvName.trim();
    if (trimmed.length === 0) {
      return;
    }
    await upsertEnvironment(collectionId, trimmed, {});
    setNewEnvName('');
    setIsAddingEnv(false);
    setExpandedEnv(trimmed);
  };

  const handleNewEnvKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      void handleAddEnvironment();
    } else if (e.key === 'Escape') {
      setNewEnvName('');
      setIsAddingEnv(false);
    }
  };

  const handleSaveVariables = async (envName: string): Promise<void> => {
    const env = environments.find((e) => e.name === envName);
    const currentVars = env?.variables ?? {};
    const edited = editedVars[envName] ?? {};
    const merged = { ...currentVars, ...edited };
    await upsertEnvironment(collectionId, envName, merged);
    setEditedVars((prev) => {
      const { [envName]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleVarChange = (envName: string, key: string, value: string): void => {
    setEditedVars((prev) => ({
      ...prev,
      [envName]: { ...(prev[envName] ?? {}), [key]: value },
    }));
  };

  return (
    <div
      className="absolute bottom-8 left-0 z-50 w-96 bg-bg-elevated border border-border-default rounded-lg shadow-lg"
      data-test-id="environment-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <span
          className="text-sm font-medium text-text-primary"
          data-test-id="environment-panel-title"
        >
          Environments
        </span>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'text-xs text-text-muted hover:text-text-primary transition-colors',
            focusRingClasses
          )}
          aria-label="Close environments panel"
          data-test-id="close-environment-panel"
        >
          Done
        </button>
      </div>

      {/* Environment list */}
      <div className="max-h-80 overflow-y-auto">
        {environments.length === 0 && !isAddingEnv && (
          <div className="px-4 py-6 text-center text-xs text-text-muted">
            No environments yet. Add one below.
          </div>
        )}

        {environments.map((env) => {
          const isExpanded = expandedEnv === env.name;
          const vars = env.variables ?? {};
          const varKeys = Object.keys(vars);

          return (
            <div key={env.name} className="border-b border-border-subtle last:border-b-0">
              {/* Row header */}
              <div
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 hover:bg-bg-raised cursor-pointer',
                  focusRingClasses
                )}
                data-test-id={`environment-row-${env.name}`}
                onClick={() => {
                  setExpandedEnv(isExpanded ? null : env.name);
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={`environment-variables-${env.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedEnv(isExpanded ? null : env.name);
                  }
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                )}
                <span className="flex-1 text-sm text-text-primary font-mono truncate">
                  {env.name}
                </span>
                <button
                  type="button"
                  data-test-id={`delete-environment-${env.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteEnvironment(env.name);
                  }}
                  className={cn(
                    'p-1 rounded text-text-muted hover:text-signal-error hover:bg-bg-raised transition-colors opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                    focusRingClasses
                  )}
                  aria-label={`Delete environment ${env.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Expanded variables editor */}
              {isExpanded && (
                <div
                  className="px-3 pb-3"
                  id={`environment-variables-${env.name}`}
                  data-test-id={`environment-variables-${env.name}`}
                >
                  <div className="bg-bg-surface rounded border border-border-subtle overflow-hidden">
                    {varKeys.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-text-muted">No variables defined.</div>
                    ) : (
                      varKeys.map((key) => {
                        const currentValue = editedVars[env.name]?.[key] ?? vars[key] ?? '';
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-2 px-3 py-1.5 border-b border-border-subtle last:border-b-0"
                          >
                            <span className="w-24 flex-shrink-0 text-xs font-mono text-text-secondary truncate">
                              {key}
                            </span>
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => {
                                handleVarChange(env.name, key, e.target.value);
                              }}
                              onBlur={() => {
                                void handleSaveVariables(env.name);
                              }}
                              className={cn(
                                'flex-1 text-xs font-mono bg-transparent text-text-primary border-none outline-none',
                                focusRingClasses
                              )}
                              data-test-id={`env-var-value-${env.name}-${key}`}
                              aria-label={`Value for ${key}`}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add environment */}
      <div className="px-3 py-2 border-t border-border-subtle">
        {isAddingEnv ? (
          <input
            ref={newEnvInputRef}
            type="text"
            value={newEnvName}
            onChange={(e) => {
              setNewEnvName(e.target.value);
            }}
            onKeyDown={handleNewEnvKeyDown}
            onBlur={() => {
              if (newEnvName.trim().length === 0) {
                setIsAddingEnv(false);
              }
            }}
            placeholder="Environment name (e.g. staging)"
            className={cn(
              'w-full text-xs font-mono bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary placeholder:text-text-muted',
              focusRingClasses
            )}
            data-test-id="new-environment-name-input"
            aria-label="New environment name"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsAddingEnv(true);
            }}
            className={cn(
              'flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors w-full py-1',
              focusRingClasses
            )}
            data-test-id="add-environment-button"
          >
            <Plus className="w-3.5 h-3.5" />
            Add environment
          </button>
        )}
      </div>
    </div>
  );
};
