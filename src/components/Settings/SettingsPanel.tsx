/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement, ReactNode } from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Settings as SettingsIcon, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GeneralTab } from './GeneralTab';
import { FeaturesTab } from './FeaturesTab';
import { McpTab } from './McpTab';
import { AboutTab } from './AboutTab';
import { SettingsSearchBar } from './SettingsSearchBar';
import { searchSettings } from './settingsSearch';
import type { SettingsSchema, SettingsCategory, SettingKey } from '@/types/settings';
import { SettingsJsonEditor } from './SettingsJsonEditor';
import { useSettings } from '@/stores/settings-store';

export type SettingsTabId = 'general' | 'features' | 'mcp' | 'about';

export interface SettingsPanelProps {
  /** Whether the panel is visible */
  isOpen?: boolean;
  /** Callback when user requests close (e.g. overlay or X) */
  onClose?: () => void;
  /** Initial settings (defaults to DEFAULT_SETTINGS) */
  initialSettings?: SettingsSchema;
  /** Callback when settings change (for persistence or parent state) */
  onSettingsChange?: (settings: SettingsSchema) => void;
  /** Optional class for the root container */
  className?: string;
  /** Optional children (e.g. preview area) */
  children?: ReactNode;
}

const TABS: Array<{ id: SettingsTabId; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'features', label: 'Features' },
  { id: 'mcp', label: 'MCP' },
  { id: 'about', label: 'About' },
];

/**
 * Settings panel: header, search, tabs (General | Features | MCP | About),
 * scrollable content, footer. Phase 1: General tab with http, storage, ui.
 */
export function SettingsPanel({
  isOpen = true,
  onClose,
  initialSettings,
  onSettingsChange,
  className,
  children,
}: SettingsPanelProps): ReactElement | null {
  const settings = useSettings((state) => state.settings);
  const setSettings = useSettings((state) => state.setSettings);
  const updateSettingAction = useSettings((state) => state.updateSetting);
  const resetToDefaultsAction = useSettings((state) => state.resetToDefaults);
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const searchResults = useMemo(() => searchSettings(searchQuery), [searchQuery]);
  const resultCount = searchResults?.size ?? 0;

  const updateSetting = useCallback(
    <C extends SettingsCategory>(
      category: C,
      key: SettingKey<C>,
      value: SettingsSchema[C][SettingKey<C>]
    ) => {
      const next = updateSettingAction(category, key, value);
      onSettingsChange?.(next);
    },
    [onSettingsChange, updateSettingAction]
  );

  const handleResetToDefaults = useCallback(() => {
    const next = resetToDefaultsAction();
    onSettingsChange?.(next);
  }, [onSettingsChange, resetToDefaultsAction]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        setIsJsonMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (initialSettings !== undefined) {
      setSettings(structuredClone(initialSettings));
    }
  }, [initialSettings, setSettings]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn('flex h-full bg-bg-app text-sm font-sans', className)}
      data-test-id="settings-panel"
    >
      <div className="w-[480px] bg-bg-surface border-r border-border-subtle flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-fg-muted" aria-hidden />
              <h1 className="text-fg-default font-medium" id="settings-title">
                Settings
              </h1>
            </div>
            {onClose !== undefined ? (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-bg-raised text-fg-muted hover:text-fg-default transition-colors"
                aria-label="Close settings"
                data-test-id="settings-close"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            {!isJsonMode && (
              <SettingsSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={resultCount}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setIsJsonMode((prev) => !prev);
              }}
              className={cn(
                'px-2 py-1 rounded-lg text-xs transition-colors',
                isJsonMode
                  ? 'bg-accent-3/20 text-accent-11'
                  : 'text-fg-muted hover:text-fg-default hover:bg-bg-raised'
              )}
              data-test-id="settings-json-toggle"
            >
              JSON
            </button>
          </div>
        </div>

        {/* Tabs */}
        {!isJsonMode && (
          <div
            className="flex border-b border-border-subtle"
            role="tablist"
            aria-label="Settings sections"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`settings-tabpanel-${tab.id}`}
                id={`settings-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors relative',
                  activeTab === tab.id ? 'text-accent-11' : 'text-fg-muted hover:text-fg-default'
                )}
                data-test-id={`settings-tab-${tab.id}`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-9" aria-hidden />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isJsonMode && (
            <SettingsJsonEditor
              settings={settings}
              onChange={(next) => {
                setSettings(next);
                onSettingsChange?.(next);
              }}
              onError={setJsonError}
            />
          )}
          {!isJsonMode && activeTab === 'general' && (
            <div
              id="settings-tabpanel-general"
              role="tabpanel"
              aria-labelledby="settings-tab-general"
              className="p-0"
            >
              <GeneralTab
                settings={settings}
                onUpdate={updateSetting}
                searchResults={searchResults}
              />
            </div>
          )}
          {!isJsonMode && activeTab === 'features' && (
            <div
              id="settings-tabpanel-features"
              role="tabpanel"
              aria-labelledby="settings-tab-features"
              className="p-0"
              data-test-id="settings-tabpanel-features"
            >
              <FeaturesTab />
            </div>
          )}
          {!isJsonMode && activeTab === 'mcp' && (
            <div
              id="settings-tabpanel-mcp"
              role="tabpanel"
              aria-labelledby="settings-tab-mcp"
              className="p-0"
              data-test-id="settings-tabpanel-mcp"
            >
              <McpTab settings={settings} onUpdate={updateSetting} />
            </div>
          )}
          {!isJsonMode && activeTab === 'about' && (
            <div
              id="settings-tabpanel-about"
              role="tabpanel"
              aria-labelledby="settings-tab-about"
              className="p-0"
              data-test-id="settings-tabpanel-about"
            >
              <AboutTab />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border-subtle flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="text-xs text-fg-muted hover:text-fg-default transition-colors"
            data-test-id="settings-reset"
          >
            Reset to defaults
          </button>
          <span className="text-[10px] text-fg-muted">
            {jsonError !== null && jsonError !== '' ? 'Invalid JSON' : 'Local preferences'}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}
