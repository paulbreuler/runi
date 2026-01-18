import React from 'react';
import { Terminal, Network } from 'lucide-react';
import { cn } from '@/utils/cn';

export type PanelTabType = 'network' | 'console';

interface PanelTabsProps {
  activeTab: PanelTabType;
  onTabChange: (tab: PanelTabType) => void;
  networkCount?: number;
  consoleCount?: number;
}

/**
 * PanelTabs - Tab switcher for dockable panel content.
 *
 * Allows switching between Network History and Console views.
 */
export const PanelTabs = ({
  activeTab,
  onTabChange,
  networkCount = 0,
  consoleCount = 0,
}: PanelTabsProps): React.JSX.Element => {
  return (
    <div className="flex items-center gap-1 border-r border-border-default pr-2 mr-2">
      <button
        type="button"
        onClick={(): void => {
          onTabChange('network');
        }}
        className={cn(
          'px-2 py-1 text-xs rounded transition-colors flex items-center gap-1.5',
          activeTab === 'network'
            ? 'bg-bg-raised text-text-primary'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/50'
        )}
        aria-selected={activeTab === 'network'}
        role="tab"
      >
        <Network size={12} />
        <span>Network</span>
        {networkCount > 0 && (
          <span className="px-1 py-0.5 text-[10px] bg-bg-elevated rounded">{networkCount}</span>
        )}
      </button>
      <button
        type="button"
        onClick={(): void => {
          onTabChange('console');
        }}
        className={cn(
          'px-2 py-1 text-xs rounded transition-colors flex items-center gap-1.5',
          activeTab === 'console'
            ? 'bg-bg-raised text-text-primary'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/50'
        )}
        aria-selected={activeTab === 'console'}
        role="tab"
      >
        <Terminal size={12} />
        <span>Console</span>
        {consoleCount > 0 && (
          <span className="px-1 py-0.5 text-[10px] bg-bg-elevated rounded">{consoleCount}</span>
        )}
      </button>
    </div>
  );
};
