/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ExpandedPanel component
 * @description Expanded panel with tab navigation for network history entries
 */

import { useState, useRef } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { cn } from '@/utils/cn';
import { TimingTab } from '@/components/History/TimingTab';
import { ResponseTab } from '@/components/History/ResponseTab';
import { HeadersTab } from '@/components/History/HeadersTab';
import { TLSTab } from '@/components/History/TLSTab';
import { CodeGenTab } from '@/components/History/CodeGenTab';
import type { NetworkHistoryEntry } from '@/types/history';
import type { CertificateData } from '@/types/certificate';
import { calculateWaterfallSegments } from '@/types/history';
import { TabNavigation } from './TabNavigation';
import { ExpandedActionButtons } from './ExpandedActionButtons';
import { useHierarchicalTabNavigation } from '@/hooks/useHierarchicalTabNavigation';

import { noop } from '@/utils/functions';

// Module-level constants for fallback functions to avoid creating new instances on every render

export type ExpandedPanelTabType = 'timing' | 'response' | 'headers' | 'tls' | 'codegen';

export interface ExpandedPanelProps {
  /** Network history entry */
  entry: NetworkHistoryEntry;
  /** TLS certificate data (optional) */
  certificate?: CertificateData | null;
  /** TLS protocol version (optional) */
  protocolVersion?: string | null;
  /** Callback when Edit & Replay button is clicked (optional) */
  onReplay?: (entry: NetworkHistoryEntry) => void;
  /** Callback when Copy cURL button is clicked (optional) */
  onCopy?: (entry: NetworkHistoryEntry) => void;
  /** Callback when Chain Request button is clicked (optional) */
  onChain?: (entry: NetworkHistoryEntry) => void;
  /** Callback when Generate Tests button is clicked (optional) */
  onGenerateTests?: (entry: NetworkHistoryEntry) => void;
  /** Callback when Add to Collection button is clicked (optional) */
  onAddToCollection?: (entry: NetworkHistoryEntry) => void;
  /** Callback when Block/Unblock button is clicked (optional) */
  onBlockToggle?: (id: string, isBlocked: boolean) => void;
  /** Whether the entry is currently blocked (optional) */
  isBlocked?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ExpandedPanel - Tabbed panel for displaying expanded row details.
 *
 * Displays network history entry details in a tabbed interface with:
 * - Timing tab (default): Shows timing waterfall and intelligence signals
 * - Response tab: Shows request/response bodies
 * - Headers tab: Shows request/response headers
 * - TLS tab: Shows TLS certificate details
 * - Code Gen tab: Shows code generation options
 * - Action buttons: Quick actions for the entry (if callbacks provided)
 *
 * @example
 * ```tsx
 * <ExpandedPanel
 *   entry={networkHistoryEntry}
 *   certificate={certData}
 *   onReplay={(e) => replayRequest(e)}
 *   onCopy={(e) => copyCurl(e)}
 * />
 * ```
 */
export const ExpandedPanel = ({
  entry,
  certificate,
  protocolVersion,
  onReplay,
  onCopy,
  onChain,
  onGenerateTests,
  onAddToCollection,
  onBlockToggle,
  isBlocked = false,
  className,
}: ExpandedPanelProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<ExpandedPanelTabType>('timing');

  // Calculate timing segments using helper function (TimingTab handles undefined)
  const segments = calculateWaterfallSegments(entry.response.timing);

  // Refs for keyboard navigation coordination
  const topLevelContainerRef = useRef<HTMLDivElement>(null);
  const headersPanelRef = useRef<HTMLDivElement>(null);
  const responsePanelRef = useRef<HTMLDivElement>(null);

  // Determine which secondary container to use based on active tab
  const hasSecondaryTabs = activeTab === 'headers' || activeTab === 'response';
  const getSecondaryContainerRef = (): React.RefObject<HTMLDivElement | null> | undefined => {
    if (activeTab === 'headers') {
      return headersPanelRef;
    }
    if (activeTab === 'response') {
      return responsePanelRef;
    }
    return undefined;
  };
  const secondaryContainerRef = getSecondaryContainerRef();

  // Set up hierarchical keyboard navigation
  const { handleTopLevelKeyDown, handleSecondaryKeyDown } = useHierarchicalTabNavigation({
    topLevelContainerRef,
    secondaryContainerRef,
    hasSecondaryTabs,
  });

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={setActiveTab as (value: string) => void}
      className={cn('flex flex-col', className)}
    >
      <div
        data-test-id="expanded-panel"
        ref={topLevelContainerRef}
        onKeyDown={handleTopLevelKeyDown}
      >
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <Tabs.Panel value="timing" className="px-4 py-3">
          <TimingTab
            segments={segments}
            totalMs={entry.response.timing.total_ms}
            isStreaming={false} // TODO: Determine from entry
            isBlocked={false} // TODO: Determine from entry
            intelligence={entry.intelligence}
          />
        </Tabs.Panel>

        <Tabs.Panel value="response" className="px-4 py-3">
          <ResponseTab
            entry={entry}
            onKeyDown={handleSecondaryKeyDown}
            containerRef={responsePanelRef}
          />
        </Tabs.Panel>

        <Tabs.Panel value="headers" className="px-4 py-3">
          <HeadersTab
            entry={entry}
            onKeyDown={handleSecondaryKeyDown}
            containerRef={headersPanelRef}
          />
        </Tabs.Panel>

        <Tabs.Panel value="tls" className="px-4 py-3">
          <TLSTab entry={entry} certificate={certificate} protocolVersion={protocolVersion} />
        </Tabs.Panel>

        <Tabs.Panel value="codegen" className="px-4 py-3">
          <CodeGenTab entry={entry} />
        </Tabs.Panel>
      </div>

      {/* Action buttons - only render if at least one callback is provided */}
      {(onReplay !== undefined ||
        onCopy !== undefined ||
        onChain !== undefined ||
        onGenerateTests !== undefined ||
        onAddToCollection !== undefined ||
        onBlockToggle !== undefined) && (
        <ExpandedActionButtons
          entry={entry}
          onReplay={onReplay ?? noop}
          onCopy={onCopy ?? noop}
          onChain={onChain ?? noop}
          onGenerateTests={onGenerateTests ?? noop}
          onAddToCollection={onAddToCollection ?? noop}
          onBlockToggle={onBlockToggle ?? noop}
          isBlocked={isBlocked}
        />
      )}
    </Tabs.Root>
  );
};
