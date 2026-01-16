import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { useRequestStore } from '@/stores/useRequestStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * HeaderEditor component for managing HTTP request headers.
 */
export const HeaderEditor = (): React.JSX.Element => {
  const { headers, setHeaders } = useRequestStore();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const headerEntries = Object.entries(headers);

  const handleAddHeader = (): void => {
    setEditingKey('new');
    setNewKey('');
    setNewValue('');
  };

  const handleSaveHeader = (): void => {
    if (newKey.trim().length === 0) {
      setEditingKey(null);
      return;
    }

    const trimmedKey = newKey.trim();
    // If renaming a header (not new), create new object without the old key
    if (editingKey !== null && editingKey !== 'new' && editingKey !== trimmedKey) {
      const newHeaders = Object.fromEntries(
        Object.entries(headers).filter(([k]) => k !== editingKey)
      );
      setHeaders({ ...newHeaders, [trimmedKey]: newValue.trim() });
    } else {
      setHeaders({ ...headers, [trimmedKey]: newValue.trim() });
    }
    setEditingKey(null);
    setNewKey('');
    setNewValue('');
  };

  const handleCancelEdit = (): void => {
    setEditingKey(null);
    setNewKey('');
    setNewValue('');
  };

  const handleEditHeader = (key: string): void => {
    setEditingKey(key);
    setNewKey(key);
    setNewValue(headers[key] ?? '');
  };

  const handleRemoveHeader = (key: string): void => {
    const newHeaders = Object.fromEntries(Object.entries(headers).filter(([k]) => k !== key));
    setHeaders(newHeaders);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveHeader();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="headers-editor">
      <div className="flex-1 overflow-auto p-4" style={{ scrollbarGutter: 'stable' }}>
        {headerEntries.length === 0 && editingKey === null && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-text-muted/50 mb-4"
            >
              <p className="text-sm">No headers configured</p>
              <p className="text-xs mt-1">Add headers to customize your request</p>
            </motion.div>
          </div>
        )}

        <div className="space-y-2">
          {headerEntries.map(([key, value]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 group"
            >
              {editingKey === key ? (
                <>
                  <Input
                    glass={true}
                    value={newKey}
                    onChange={(e) => {
                      setNewKey(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Header name"
                    className="flex-1 font-mono text-sm"
                    autoFocus
                  />
                  <span className="text-text-muted">:</span>
                  <Input
                    glass={true}
                    value={newValue}
                    onChange={(e) => {
                      setNewValue(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Header value"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleSaveHeader}
                    className="text-signal-success hover:text-signal-success hover:bg-signal-success/10"
                  >
                    <X className="rotate-45" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCancelEdit}
                    className="text-text-muted hover:text-text-secondary"
                  >
                    <X />
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-raised border border-border-subtle hover:border-border-default transition-colors cursor-pointer"
                    onClick={() => {
                      handleEditHeader(key);
                    }}
                  >
                    <span className="text-accent-blue font-mono text-sm font-medium">{key}</span>
                    <span className="text-text-muted">:</span>
                    <span className="text-text-secondary font-mono text-sm flex-1 truncate">
                      {value}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      handleRemoveHeader(key);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-signal-error hover:text-signal-error hover:bg-signal-error/10"
                    data-testid={`remove-header-${key}`}
                  >
                    <X />
                  </Button>
                </>
              )}
            </motion.div>
          ))}

          {editingKey === 'new' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Input
                glass={true}
                value={newKey}
                onChange={(e) => {
                  setNewKey(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Header name"
                className="flex-1 font-mono text-sm"
                autoFocus
              />
              <span className="text-text-muted">:</span>
              <Input
                glass={true}
                value={newValue}
                onChange={(e) => {
                  setNewValue(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Header value"
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSaveHeader}
                className="text-signal-success hover:text-signal-success hover:bg-signal-success/10"
              >
                <X className="rotate-45" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCancelEdit}
                className="text-text-muted hover:text-text-secondary"
              >
                <X />
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {editingKey === null && (
        <div className="border-t border-border-subtle p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddHeader}
            className="w-full"
            data-testid="add-header-button"
          >
            <Plus className="size-4" />
            Add Header
          </Button>
        </div>
      )}
    </div>
  );
};
