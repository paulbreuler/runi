<script lang="ts">
  import { executeRequest } from '$lib/api/http';
  import { createRequestParams, type HttpMethod, type HttpResponse } from '$lib/types/http';
  import MainLayout from '$lib/components/Layout/MainLayout.svelte';
  import RequestHeader from '$lib/components/Request/RequestHeader.svelte';
  import StatusBadge from '$lib/components/Response/StatusBadge.svelte';

  // State
  let url = $state('https://httpbin.org/get');
  let method = $state<HttpMethod>('GET');
  let loading = $state(false);
  let response = $state<HttpResponse | null>(null);
  let error = $state<string | null>(null);

  // Derived
  const isValidUrl = $derived(url.length > 0);

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

  function handleMethodChange(newMethod: HttpMethod): void {
    method = newMethod;
  }
</script>

<MainLayout>
  {#snippet headerContent()}
    <RequestHeader
      bind:url
      {method}
      {loading}
      onMethodChange={handleMethodChange}
      onSend={handleSend}
    />
  {/snippet}

  {#snippet requestContent()}
    <div class="h-full flex flex-col">
      {#if error}
        <div
          class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive m-4"
          role="alert"
          data-testid="error-panel"
        >
          <strong>Error:</strong>
          {error}
        </div>
      {/if}
      <div class="flex-1 p-4 text-muted-foreground">
        Request builder content will go here
      </div>
    </div>
  {/snippet}

  {#snippet responseContent()}
    <div class="h-full flex flex-col">
      {#if response}
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="flex justify-between items-center px-4 py-2 border-b border-border bg-muted/30">
            <StatusBadge status={response.status} statusText={response.status_text} />
            <span
              class="text-muted-foreground text-sm font-mono transition-colors duration-200"
              data-testid="response-timing"
            >
              {response.timing.total_ms}ms
            </span>
          </div>

          <div class="flex-1 overflow-auto p-4 bg-card">
            <pre
              class="font-mono text-sm whitespace-pre-wrap break-words text-foreground"
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
