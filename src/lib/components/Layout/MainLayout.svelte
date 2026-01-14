<script lang="ts">
  import { PaneGroup, Pane, PaneResizer } from 'paneforge';
  import Sidebar from './Sidebar.svelte';
  import StatusBar from './StatusBar.svelte';
  import type { Snippet } from 'svelte';
  import { isMacSync, getModifierKeyName } from '$lib/utils/platform';
  import { createKeyboardHandler } from '$lib/utils/keyboard';
  import { createCompactQuery, createStandardQuery } from '$lib/utils/responsive';
  import { globalCommandRegistry } from '$lib/commands/registry';
  import { globalEventBus } from '$lib/events/bus';

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

  interface SidebarVisibilityPayload {
    visible: boolean;
  }

  const {
    headerContent,
    requestContent,
    responseContent,
    initialSidebarVisible = true,
  }: Props = $props();

  // Sidebar state - managed internally but can be controlled via commands/events
  // Capture initial value in closure to avoid Svelte warning
  let sidebarVisible = $state(
    ((): boolean => {
      const initial = initialSidebarVisible;
      return initial;
    })()
  );

  // Responsive breakpoints (desktop-first: window resizing)
  const compactQuery = createCompactQuery();
  const standardQuery = createStandardQuery();
  const isCompact = $derived(compactQuery.matches); // Small window (< 768px)
  const isStandard = $derived(standardQuery.matches); // Medium window (768px - 1024px)
  const isSpacious = $derived(!isCompact && !isStandard); // Large window (> 1024px)

  // Determine pane direction based on window size
  // Compact windows: stack vertically for better use of space
  const paneDirection = $derived(isCompact ? 'vertical' : 'horizontal');

  // Toggle sidebar function
  function toggleSidebar(): void {
    sidebarVisible = !sidebarVisible;
    // Emit event for loose coupling
    globalEventBus.emit('sidebar.toggled', { visible: sidebarVisible }, 'MainLayout');
  }

  // Register sidebar toggle command (extensible)
  $effect(() => {
    globalCommandRegistry.register({
      id: 'sidebar.toggle',
      title: 'Toggle Sidebar',
      handler: toggleSidebar,
      shortcut: {
        key: 'b',
        modifier: isMacSync() ? 'meta' : 'ctrl',
        handler: toggleSidebar,
        description: `${getModifierKeyName()}B - Toggle sidebar`,
      },
      category: 'view',
      description: 'Show or hide the sidebar',
    });

    // Cleanup on unmount
    return (): void => {
      globalCommandRegistry.unregister('sidebar.toggle');
    };
  });

  // Set up keyboard shortcut using utility
  $effect(() => {
    return createKeyboardHandler({
      key: 'b',
      modifier: isMacSync() ? 'meta' : 'ctrl',
      handler: toggleSidebar,
      description: 'Toggle sidebar',
    });
  });

  // Listen to sidebar visibility changes from events (for extensibility)
  $effect(() => {
    const unsubscribe = globalEventBus.on<SidebarVisibilityPayload>(
      'sidebar.visible-changed',
      (event) => {
        sidebarVisible = event.payload.visible;
      }
    );
    return unsubscribe;
  });
</script>

<div class="flex h-screen flex-col bg-background" data-testid="main-layout">
  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar with responsive behavior -->
    <!-- Desktop: Fixed width, collapsible -->
    <!-- Compact windows: Overlay drawer for better space usage -->
    <div
      class="transition-all duration-200 overflow-hidden"
      class:w-64={sidebarVisible && isSpacious}
      class:w-0={!sidebarVisible || !isSpacious}
      class:fixed={sidebarVisible && isCompact}
      class:inset-y-0={sidebarVisible && isCompact}
      class:left-0={sidebarVisible && isCompact}
      class:z-50={sidebarVisible && isCompact}
      class:shadow-lg={sidebarVisible && isCompact}
    >
      {#if sidebarVisible}
        <Sidebar />
      {/if}
    </div>

    <!-- Overlay backdrop for compact window sidebar -->
    {#if sidebarVisible && isCompact}
      <button
        type="button"
        class="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 cursor-pointer"
        onclick={toggleSidebar}
        onkeydown={(e): void => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSidebar();
          }
        }}
        data-testid="sidebar-overlay"
        aria-label="Close sidebar"
      ></button>
    {/if}

    <!-- Vertical layout: Fixed header bar + split content area -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Fixed header bar (no resizer) -->
      <div class="shrink-0" data-testid="header-bar">
        {#if headerContent}
          {@render headerContent()}
        {:else}
          <div class="h-14 p-2 text-muted-foreground flex items-center">Header bar placeholder</div>
        {/if}
      </div>

      <!-- Responsive split: Request/Response -->
      <!-- Desktop: Horizontal split (side-by-side) -->
      <!-- Mobile: Vertical split (stacked) -->
      <div class="flex-1 overflow-hidden">
        <PaneGroup direction={paneDirection} class="h-full">
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
            class="bg-border hover:bg-primary/20 transition-colors duration-200 {paneDirection ===
            'horizontal'
              ? 'w-2 cursor-col-resize'
              : 'h-2 cursor-row-resize'}"
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
