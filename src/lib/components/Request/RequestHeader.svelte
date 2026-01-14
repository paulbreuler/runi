<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import { getMethodColor, type HttpMethod } from '$lib/utils/http-colors';

  interface Props {
    /** Current HTTP method */
    method: HttpMethod;
    /** Current URL value */
    url: string;
    /** Loading state */
    loading?: boolean;
    /** Callback when method changes */
    onMethodChange?: (method: HttpMethod) => void;
    /** Callback when send button clicked or Enter pressed */
    onSend?: () => void;
  }

  let { method, url, loading = false, onMethodChange, onSend }: Props = $props();

  // HTTP methods for select
  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  // Derived
  const methodColorClass = $derived(getMethodColor(method));
  const isValidUrl = $derived(url.length > 0);

  // Handlers
  function handleMethodChange(value: string | undefined): void {
    if (value !== undefined && value.length > 0 && onMethodChange !== undefined) {
      onMethodChange(value as HttpMethod);
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !loading && isValidUrl && onSend) {
      onSend();
    }
  }
</script>

<div class="flex gap-2 items-center px-4 py-3 border-b border-border bg-muted/30">
  <Select.Root type="single" value={method} onValueChange={handleMethodChange}>
    <Select.Trigger
      class="w-28 font-semibold transition-colors duration-200 {methodColorClass}"
      data-testid="method-select"
      disabled={loading}
      aria-label="HTTP Method"
    >
      {method}
    </Select.Trigger>
    <Select.Content>
      {#each httpMethods as httpMethod (httpMethod)}
        <Select.Item value={httpMethod} class={getMethodColor(httpMethod)}>
          {httpMethod}
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>

  <Input
    type="text"
    bind:value={url}
    onkeydown={handleKeyDown}
    placeholder="Enter URL"
    data-testid="url-input"
    disabled={loading}
    aria-label="Request URL"
    class="flex-1 transition-colors duration-200"
  />

  <Button
    onclick={onSend}
    disabled={!isValidUrl || loading}
    data-testid="send-button"
    aria-label="Send Request"
    class="transition-colors duration-200"
  >
    {loading ? 'Sending...' : 'Send'}
  </Button>
</div>
