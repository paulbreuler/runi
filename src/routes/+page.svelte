<script lang="ts">
  import { executeRequest } from '$lib/api/http';
  import { createRequestParams, type HttpMethod, type HttpResponse } from '$lib/types/http';

  // State
  let url = $state('https://httpbin.org/get');
  let method = $state<HttpMethod>('GET');
  let loading = $state(false);
  let response = $state<HttpResponse | null>(null);
  let error = $state<string | null>(null);

  // Derived
  let isValidUrl = $derived(url.length > 0);
  let statusClass = $derived(
    response
      ? response.status >= 200 && response.status < 300
        ? 'status-success'
        : response.status >= 400
          ? 'status-error'
          : 'status-info'
      : ''
  );

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
</script>

<div class="container">
  <header class="header">
    <h1>runi</h1>
    <p class="subtitle">Your API Development Partner</p>
  </header>

  <section class="request-builder">
    <div class="url-bar">
      <select
        bind:value={method}
        data-testid="method-select"
        disabled={loading}
        aria-label="HTTP Method"
      >
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
        <option value="HEAD">HEAD</option>
        <option value="OPTIONS">OPTIONS</option>
      </select>

      <input
        type="text"
        bind:value={url}
        onkeydown={handleKeyDown}
        placeholder="Enter URL"
        data-testid="url-input"
        disabled={loading}
        aria-label="Request URL"
      />

      <button
        onclick={handleSend}
        disabled={!isValidUrl || loading}
        data-testid="send-button"
        aria-label="Send Request"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  </section>

  {#if error}
    <section class="error-panel" role="alert" data-testid="error-panel">
      <strong>Error:</strong>
      {error}
    </section>
  {/if}

  {#if response}
    <section class="response-panel" data-testid="response-panel">
      <div class="response-header">
        <span class="status {statusClass}" data-testid="response-status">
          {response.status}
          {response.status_text}
        </span>
        <span class="timing" data-testid="response-timing">
          {response.timing.total_ms}ms
        </span>
      </div>

      <div class="response-body">
        <pre data-testid="response-body">{response.body}</pre>
      </div>
    </section>
  {/if}
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2rem;
    margin: 0;
    color: #333;
  }

  .subtitle {
    color: #666;
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
  }

  .request-builder {
    margin-bottom: 1.5rem;
  }

  .url-bar {
    display: flex;
    gap: 0.5rem;
    align-items: stretch;
  }

  select {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    cursor: pointer;
    min-width: 100px;
  }

  select:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }

  input[type='text'] {
    flex: 1;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    outline: none;
    transition: border-color 0.15s;
  }

  input[type='text']:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }

  input[type='text']:disabled {
    background-color: #e9ecef;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  button:hover:not(:disabled) {
    background-color: #0056b3;
  }

  button:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }

  .error-panel {
    padding: 1rem;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 0.375rem;
    color: #721c24;
    margin-bottom: 1rem;
  }

  .response-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    overflow: hidden;
  }

  .response-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }

  .status {
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  .status-success {
    background-color: #d4edda;
    color: #155724;
  }

  .status-error {
    background-color: #f8d7da;
    color: #721c24;
  }

  .status-info {
    background-color: #d1ecf1;
    color: #0c5460;
  }

  .timing {
    color: #6c757d;
    font-size: 0.875rem;
  }

  .response-body {
    flex: 1;
    overflow: auto;
    padding: 1rem;
    background-color: #fff;
  }

  pre {
    margin: 0;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
    font-size: 0.8125rem;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
