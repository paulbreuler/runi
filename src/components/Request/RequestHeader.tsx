import React from 'react';
import { Button } from '@/components/ui/button';
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

  const methodColorClass = getMethodColor(method);
  const isValidUrl = url.length > 0;

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
    <div className="flex gap-2 items-center px-4 py-3 border-b border-border-default bg-bg-surface">
      <Select.Select value={method} onValueChange={handleMethodChange}>
        <Select.SelectTrigger
          className={`w-28 font-semibold transition-colors duration-200 ${methodColorClass}`}
          data-testid="method-select"
          disabled={loading}
          aria-label="HTTP Method"
        >
          <Select.SelectValue>{method}</Select.SelectValue>
        </Select.SelectTrigger>
        <Select.SelectContent>
          {httpMethods.map((httpMethod) => (
            <Select.SelectItem key={httpMethod} value={httpMethod} className={getMethodColor(httpMethod)}>
              {httpMethod}
            </Select.SelectItem>
          ))}
        </Select.SelectContent>
      </Select.Select>

      <Input
        type="text"
        value={url}
        onChange={(e) => onUrlChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter URL"
        data-testid="url-input"
        disabled={loading}
        aria-label="Request URL"
        className="flex-1 transition-colors duration-200"
      />

      <Button
        onClick={onSend}
        disabled={!isValidUrl || loading}
        data-testid="send-button"
        aria-label="Send Request"
        className="transition-colors duration-200"
      >
        {loading ? 'Sending...' : 'Send'}
      </Button>
    </div>
  );
};
