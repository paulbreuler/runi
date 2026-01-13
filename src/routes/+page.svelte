<script lang="ts">
  import { executeRequest } from '$lib/api/http';
  import { createRequestParams, type HttpMethod, type HttpResponse } from '$lib/types/http';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import MainLayout from '$lib/components/Layout/MainLayout.svelte';

  // State
  let url = $state('https://httpbin.org/get');
  let method = $state<HttpMethod>('GET');
  let loading = $state(false);
  let response = $state<HttpResponse | null>(null);
  let error = $state<string | null>(null);

  // Derived
  let isValidUrl = $derived(url.length > 0);
  let statusColorClass = $derived(
    !response
      ? ''
      : response.status >= 200 && response.status < 300
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        : response.status >= 400
          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  );

  // HTTP methods for select
  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  // Handlers
  async function handleSend(): Promise<void> {
    if (!isValidUrl) return;

    loading = true;
    error = null;
    response = null;

    try {
      const params = createRequestParams(url, method);
      response = await executeRequest(params);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !loading && isValidUrl) {
      handleSend();
    }
  }

  function handleMethodChange(value: string | undefined): void {
    if (value) {
      method = value as HttpMethod;
    }
  }
</script>

<MainLayout>
  {#snippet requestContent()}
    <div class="h-full flex flex-col p-4">
      <header class="mb-4">
        <h1 class="text-xl font-bold text-foreground">Request</h1>
      </header>

      <section class="mb-4">
        <div class="flex gap-2 items-stretch">
          <Select.Root type="single" value={method} onValueChange={handleMethodChange}>
            <Select.Trigger
              class="w-28 font-semibold"
              data-testid="method-select"
              disabled={loading}
              aria-label="HTTP Method"
            >
              {method}
            </Select.Trigger>
            <Select.Content>
              {#each httpMethods as httpMethod (httpMethod)}
                <Select.Item value={httpMethod}>{httpMethod}</Select.Item>
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
            class="flex-1"
          />

          <Button
            onclick={handleSend}
            disabled={!isValidUrl || loading}
            data-testid="send-button"
            aria-label="Send Request"
          >
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </section>

      {#if error}
        <section
          class="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive"
          role="alert"
          data-testid="error-panel"
        >
          <strong>Error:</strong>
          {error}
        </section>
      {/if}
    </div>
  {/snippet}

  {#snippet responseContent()}
    <div class="h-full flex flex-col">
      <header class="p-4 border-b border-border">
        <h1 class="text-xl font-bold text-foreground">Response</h1>
      </header>

      {#if response}
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="flex justify-between items-center px-4 py-3 bg-muted border-b border-border">
            <span
              class="font-semibold px-2 py-1 rounded text-sm {statusColorClass}"
              data-testid="response-status"
            >
              {response.status}
              {response.status_text}
            </span>
            <span class="text-muted-foreground text-sm" data-testid="response-timing">
              {response.timing.total_ms}ms
            </span>
          </div>

          <div class="flex-1 overflow-auto p-4 bg-card">
            <pre
              class="font-mono text-sm whitespace-pre-wrap break-words"
              data-testid="response-body">{response.body}</pre>
          </div>
        </div>
      {:else}
        <div class="flex-1 flex items-center justify-center text-muted-foreground">
          Send a request to see the response
        </div>
      {/if}
    </div>
  {/snippet}
</MainLayout>
