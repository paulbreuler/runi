import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRequestStore } from '@/stores/useRequestStore';
import { HeaderEditor } from './HeaderEditor';
import { BodyEditor } from './BodyEditor';
import { ParamsEditor } from './ParamsEditor';
import { AuthEditor } from './AuthEditor';
import { cn } from '@/utils/cn';

type TabId = 'headers' | 'body' | 'params' | 'auth';

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'params', label: 'Params' },
  { id: 'auth', label: 'Auth' },
];

/**
 * RequestBuilder component for constructing HTTP requests.
 * Provides tabs for configuring headers, body, query parameters, and authentication.
 */
export const RequestBuilder = (): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<TabId>('headers');

  return (
    <div className="h-full flex flex-col bg-bg-app" data-testid="request-builder">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border-subtle bg-bg-surface">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); }}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 font-medium',
                isActive
                  ? 'bg-bg-raised text-text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-raised/50'
              )}
              whileHover={!isActive ? { scale: 1.02 } : undefined}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Tab content - overflow hidden to prevent scrollbar flash during transitions */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'headers' && (
            <motion.div
              key="headers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <HeaderEditor />
            </motion.div>
          )}

          {activeTab === 'body' && (
            <motion.div
              key="body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <BodyEditor />
            </motion.div>
          )}

          {activeTab === 'params' && (
            <motion.div
              key="params"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <ParamsEditor />
            </motion.div>
          )}

          {activeTab === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto"
              style={{ scrollbarGutter: 'stable' }}
            >
              <AuthEditor />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
