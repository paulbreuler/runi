import React from 'react';
import { motion } from 'motion/react';
import { useRequestStore } from '@/stores/useRequestStore';
import { cn } from '@/utils/cn';

/**
 * BodyEditor component for editing HTTP request body.
 */
export const BodyEditor = (): React.JSX.Element => {
  const { body, setBody } = useRequestStore();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setBody(e.target.value);
  };

  const isJson = (): boolean => {
    if (!body.trim()) return false;
    try {
      JSON.parse(body);
      return true;
    } catch {
      return false;
    }
  };

  const formatJson = (): void => {
    if (!body.trim()) return;
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
    } catch {
      // Invalid JSON, do nothing
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="body-editor">
      <div className="flex-1 overflow-hidden relative">
        <textarea
          value={body}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              const newValue = body.substring(0, start) + '  ' + body.substring(end);
              setBody(newValue);
              setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
              }, 0);
            }
          }}
          placeholder="Enter request body (JSON, XML, text, etc.)"
          className={cn(
            'w-full h-full p-4 font-mono text-sm leading-relaxed',
            'bg-bg-app text-text-secondary',
            'border-0 outline-none resize-none',
            'focus:outline-none',
            'placeholder:text-text-muted/50'
          )}
          data-testid="body-textarea"
          spellCheck={false}
        />

        {/* JSON validation indicator */}
        {body.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 flex items-center gap-2"
          >
            {isJson() ? (
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-signal-success/10 text-signal-success text-xs">
                <span className="size-1.5 rounded-full bg-signal-success" />
                Valid JSON
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-signal-error/10 text-signal-error text-xs">
                <span className="size-1.5 rounded-full bg-signal-error" />
                Invalid JSON
              </div>
            )}
            {isJson() && (
              <button
                onClick={formatJson}
                className="px-2 py-1 text-xs rounded bg-bg-raised text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                Format
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
