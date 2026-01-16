import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { useRequestStore } from '@/stores/useRequestStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * ParamsEditor component for managing URL query parameters.
 */
export const ParamsEditor = (): React.JSX.Element => {
  const { url, setUrl } = useRequestStore();
  const [params, setParams] = useState<Array<{ key: string; value: string }>>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

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
        if (key.trim()) {
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
      if (newKey.trim()) {
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
    setEditingIndex(index);
    setNewKey(params[index].key);
    setNewValue(params[index].value);
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
    <div className="h-full flex flex-col" data-testid="params-editor">
      <div className="flex-1 overflow-auto p-4" style={{ scrollbarGutter: 'stable' }}>
        {params.length === 0 && editingIndex === null && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-text-muted/50 mb-4"
            >
              <p className="text-sm">No query parameters</p>
              <p className="text-xs mt-1">Add parameters to append to the URL</p>
            </motion.div>
          </div>
        )}

        <div className="space-y-2">
          {params.map((param, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 group"
            >
              {editingIndex === index ? (
                <>
                  <Input
                    glass={true}
                    value={newKey}
                    onChange={(e) => { setNewKey(e.target.value); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Parameter name"
                    className="flex-1 font-mono text-sm"
                    autoFocus
                  />
                  <span className="text-text-muted">=</span>
                  <Input
                    glass={true}
                    value={newValue}
                    onChange={(e) => { setNewValue(e.target.value); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Parameter value"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleSaveParam}
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
                    onClick={() => { handleEditParam(index); }}
                  >
                    <span className="text-accent-blue font-mono text-sm font-medium">{param.key}</span>
                    <span className="text-text-muted">=</span>
                    <span className="text-text-secondary font-mono text-sm flex-1 truncate">{param.value}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => { handleRemoveParam(index); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-signal-error hover:text-signal-error hover:bg-signal-error/10"
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
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Input
                glass={true}
                value={newKey}
                onChange={(e) => { setNewKey(e.target.value); }}
                onKeyDown={handleKeyDown}
                placeholder="Parameter name"
                className="flex-1 font-mono text-sm"
                autoFocus
              />
              <span className="text-text-muted">=</span>
              <Input
                glass={true}
                value={newValue}
                onChange={(e) => { setNewValue(e.target.value); }}
                onKeyDown={handleKeyDown}
                placeholder="Parameter value"
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSaveParam}
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

      {editingIndex === null && (
        <div className="border-t border-border-subtle p-4">
          <Button variant="outline" size="sm" onClick={handleAddParam} className="w-full">
            <Plus className="size-4" />
            Add Parameter
          </Button>
        </div>
      )}
    </div>
  );
};
