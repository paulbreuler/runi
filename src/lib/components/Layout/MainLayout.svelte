<script lang="ts">
  import { PaneGroup, Pane, PaneResizer } from 'paneforge';
  import Sidebar from './Sidebar.svelte';
  import StatusBar from './StatusBar.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Content to render in the request header bar (top panel with method/URL/send) */
    headerContent?: Snippet;
    /** Content to render in the request builder pane (left side of bottom area) */
    requestContent?: Snippet;
    /** Content to render in the response viewer pane (right side of bottom area) */
    responseContent?: Snippet;
    /** Initial sidebar visibility state */
    initialSidebarVisible?: boolean;
  }

  const { headerContent, requestContent, responseContent, initialSidebarVisible = true }: Props =
    $props();

  // Intentionally capture initial value only - sidebar state is managed internally
  let sidebarVisible = $state(initialSidebarVisible as boolean);

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

    <!-- Vertical layout: Fixed header bar + split content area -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Fixed header bar (no resizer) -->
      <div class="shrink-0" data-testid="header-bar">
        {#if headerContent}
          {@render headerContent()}
        {:else}
          <div class="h-14 p-2 text-muted-foreground flex items-center">
            Header bar placeholder
          </div>
        {/if}
      </div>

      <!-- Horizontal split: Request/Response -->
      <div class="flex-1 overflow-hidden">
        <PaneGroup direction="horizontal" class="h-full">
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
            class="w-2 bg-border hover:bg-primary/20 cursor-col-resize transition-colors duration-200"
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
    </div>
  </div>
  <StatusBar />
</div>
