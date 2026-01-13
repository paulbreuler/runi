<script lang="ts">
  import { PaneGroup, Pane, PaneResizer } from 'paneforge';
  import Sidebar from './Sidebar.svelte';
  import StatusBar from './StatusBar.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Content to render in the request pane (left side of center area) */
    requestContent?: Snippet;
    /** Content to render in the response pane (right side of center area) */
    responseContent?: Snippet;
    /** Initial sidebar visibility state */
    initialSidebarVisible?: boolean;
  }

  let { requestContent, responseContent, initialSidebarVisible = true }: Props = $props();

  let sidebarVisible = $state(initialSidebarVisible);

  function toggleSidebar(): void {
    sidebarVisible = !sidebarVisible;
  }

  // Handle ⌘B (macOS) or Ctrl+B (Windows/Linux)
  $effect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="flex h-screen flex-col bg-background" data-testid="main-layout">
  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar with smooth collapse transition -->
    <div
      class="transition-all duration-200 overflow-hidden"
      class:w-64={sidebarVisible}
      class:w-0={!sidebarVisible}
    >
      {#if sidebarVisible}
        <Sidebar />
      {/if}
    </div>

    <!-- Sidebar toggle button -->
    <button
      type="button"
      onclick={toggleSidebar}
      class="absolute top-2 left-2 z-10 p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      class:left-2={!sidebarVisible}
      class:left-[17rem]={sidebarVisible}
      data-testid="sidebar-toggle"
      aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
      title="Toggle sidebar (⌘B)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <line x1="9" x2="9" y1="3" y2="21" />
      </svg>
    </button>

    <!-- Horizontal split: Request (left) | Response (right) -->
    <PaneGroup direction="horizontal" class="flex-1">
      <Pane defaultSize={50} minSize={30}>
        <div class="h-full" data-testid="request-pane">
          {#if requestContent}
            {@render requestContent()}
          {:else}
            <div class="h-full p-4 text-muted-foreground flex items-center justify-center">
              Request Builder (placeholder - will be built in Run 2B)
            </div>
          {/if}
        </div>
      </Pane>
      <PaneResizer
        class="w-2 bg-border hover:bg-primary/20 cursor-col-resize transition-colors"
        data-testid="pane-resizer"
      />
      <Pane minSize={30}>
        <div class="h-full" data-testid="response-pane">
          {#if responseContent}
            {@render responseContent()}
          {:else}
            <div class="h-full p-4 text-muted-foreground flex items-center justify-center">
              Response Viewer (placeholder - will be built in Run 2C)
            </div>
          {/if}
        </div>
      </Pane>
    </PaneGroup>
  </div>
  <StatusBar />
</div>
