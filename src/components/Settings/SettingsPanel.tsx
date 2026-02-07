/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { ReactElement, ReactNode } from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { Settings as SettingsIcon, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GeneralTab } from './GeneralTab';
import { FeaturesTab } from './FeaturesTab';
import { AboutTab } from './AboutTab';
import { SettingsSearchBar } from './SettingsSearchBar';
import { searchSettings } from './settingsSearch';
import type { SettingsSchema, SettingsCategory, SettingKey } from '@/types/settings';
import { SettingsJsonEditor } from './SettingsJsonEditor';
import { useSettings } from '@/stores/settings-store';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/Switch';
import { BaseTabsList } from '@/components/ui/BaseTabsList';

export type SettingsTabId = 'general' | 'features' | 'about';

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
  { id: 'about', label: 'About' },
];

/**
 * Settings panel: header, search, tabs (General | Features | About),
 * scrollable content, footer.
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
  const [jsonMatchCount, setJsonMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const searchResults = useMemo(
    () => searchSettings(searchQuery, { caseSensitive }),
    [searchQuery, caseSensitive]
  );

  // Filter out MCP results in form mode (MCP tab was removed)
  const filteredSearchResults = useMemo(() => {
    if (searchResults === null || isJsonMode) {
      return searchResults;
    }
    const filtered = new Set<string>();
    for (const key of searchResults) {
      // Exclude 'mcp' category and 'mcp.*' keys in form mode
      if (!key.startsWith('mcp')) {
        filtered.add(key);
      }
    }
    return filtered;
  }, [searchResults, isJsonMode]);

  const formResultCount = filteredSearchResults?.size ?? 0;
  const resultCount = isJsonMode ? jsonMatchCount : formResultCount;

  // Reset to first match when search query changes in JSON mode
  useEffect(() => {
    if (isJsonMode) {
      setCurrentMatchIndex(0);
    }
  }, [searchQuery, isJsonMode, caseSensitive]);

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

  const handlePrevMatch = useCallback((): void => {
    if (jsonMatchCount === 0) {
      return;
    }
    setCurrentMatchIndex((i) => (i <= 0 ? jsonMatchCount - 1 : i - 1));
  }, [jsonMatchCount]);

  const handleNextMatch = useCallback((): void => {
    if (jsonMatchCount === 0) {
      return;
    }
    setCurrentMatchIndex((i) => (i + 1) % jsonMatchCount);
  }, [jsonMatchCount]);

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
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Close settings"
                data-test-id="settings-close"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SettingsSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={resultCount}
                jsonMode={isJsonMode}
                currentMatchIndex={currentMatchIndex}
                caseSensitive={caseSensitive}
                onCaseSensitiveChange={setCaseSensitive}
                onPrevMatch={isJsonMode && jsonMatchCount > 0 ? handlePrevMatch : undefined}
                onNextMatch={isJsonMode && jsonMatchCount > 0 ? handleNextMatch : undefined}
              />
            </div>
            <label className="flex shrink-0 items-center gap-2 text-xs text-fg-muted">
              <span>JSON</span>
              <Switch
                checked={isJsonMode}
                onCheckedChange={setIsJsonMode}
                aria-label="Toggle JSON mode"
                data-test-id="settings-json-toggle"
              />
            </label>
          </div>
        </div>

        {/* Tabs */}
        {!isJsonMode && (
          <Tabs.Root
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as SettingsTabId);
            }}
          >
            <BaseTabsList
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={TABS.map((tab) => ({
                value: tab.id,
                label: tab.label,
                testId: `settings-tab-${tab.id}`,
              }))}
              listClassName="flex border-b border-border-subtle"
              listAriaLabel="Settings sections"
              tabClassName="flex-1 py-2.5 text-xs font-medium transition-colors relative"
              activeTabClassName="text-accent-11"
              inactiveTabClassName="text-fg-muted hover:text-fg-default"
              indicatorLayoutId="settings-tab-indicator"
              indicatorClassName="bottom-0 left-0 right-0 h-0.5 bg-accent-9"
              listTestId="settings-tabs"
              indicatorTestId="settings-tab-indicator"
            />
          </Tabs.Root>
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
              searchQuery={searchQuery}
              caseSensitive={caseSensitive}
              currentMatchIndex={currentMatchIndex}
              onMatchCountChange={setJsonMatchCount}
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
                searchResults={filteredSearchResults}
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
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleResetToDefaults}
            className="text-fg-muted hover:text-fg-default"
            data-test-id="settings-reset"
          >
            Reset to defaults
          </Button>
          <span className="text-xs text-fg-muted">
            {jsonError !== null && jsonError !== '' ? 'Invalid JSON' : 'Local preferences'}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}
