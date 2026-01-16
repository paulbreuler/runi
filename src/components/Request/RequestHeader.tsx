import React from 'react';
import { Input } from '@/components/ui/input';
import * as Select from '@/components/ui/select';
import { getMethodColor, type HttpMethod } from '@/utils/http-colors';

interface RequestHeaderProps {
  method: HttpMethod;
  url?: string;
  loading?: boolean;
  onMethodChange?: (method: HttpMethod) => void;
  onUrlChange?: (url: string) => void;
  onSend?: () => void;
}

export const RequestHeader = ({
  method,
  url = '',
  loading = false,
  onMethodChange,
  onUrlChange,
  onSend,
}: RequestHeaderProps): React.JSX.Element => {
  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  const isValidUrl = url.length > 0;
  const methodColor = getMethodColor(method);

  const handleMethodChange = (value: string | undefined): void => {
    if (value !== undefined && value.length > 0 && onMethodChange) {
      onMethodChange(value as HttpMethod);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !loading && isValidUrl && onSend) {
      onSend();
    }
  };

  return (
    <div className="flex gap-3 items-center px-6 py-4 border-b border-border-subtle bg-bg-surface">
      <Select.Select value={method} onValueChange={handleMethodChange}>
        <Select.SelectTrigger
          className={`w-20 font-semibold bg-transparent border-0 hover:bg-bg-raised/50 rounded-lg transition-all duration-200 ${methodColor}`}
          data-testid="method-select"
          disabled={loading}
          aria-label="HTTP Method"
        >
          <Select.SelectValue>{method}</Select.SelectValue>
        </Select.SelectTrigger>
        <Select.SelectContent>
          {httpMethods.map((httpMethod) => {
            const color = getMethodColor(httpMethod);
            return (
              <Select.SelectItem 
                key={httpMethod} 
                value={httpMethod} 
                className={`${color} data-highlighted:bg-bg-raised/50`}
              >
                {httpMethod}
              </Select.SelectItem>
            );
          })}
        </Select.SelectContent>
      </Select.Select>

      <Input
        type="text"
        value={url}
        onChange={(e) => onUrlChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter request URL..."
        data-testid="url-input"
        disabled={loading}
        aria-label="Request URL"
        glass={true}
        className="flex-1"
      />

      <button
        onClick={onSend}
        disabled={!isValidUrl || loading}
        data-testid="send-button"
        aria-label="Send Request"
        className="inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-purple focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app disabled:pointer-events-none disabled:opacity-50 bg-transparent text-text-muted hover:text-accent-blue hover:bg-bg-raised/50 px-5 py-2 text-sm h-9"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};
