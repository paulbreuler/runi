<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from '@storybook/test';
  import Sidebar from './Sidebar.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Sidebar',
    component: Sidebar,
    tags: ['autodocs'],
    parameters: {
      layout: 'fullscreen',
    },
  });
</script>

<Story name="Expanded">
  {#snippet template(_args: Record<string, any>)}
    <div class="h-screen w-full flex">
      <div class="h-full flex-shrink-0">
        <Sidebar />
      </div>
      <div class="flex-1 bg-background flex items-center justify-center text-muted-foreground">
        Main content area
      </div>
    </div>
  {/snippet}

  {#snippet play({ canvasElement })}
    const canvas = within(canvasElement); const sidebar = canvas.getByTestId('sidebar'); // Verify
    sidebar is rendered await expect(sidebar).toBeInTheDocument(); // Verify sidebar has correct
    width await expect(sidebar).toHaveClass('w-64'); // Verify sidebar takes full height (check
    computed style) const sidebarStyle = window.getComputedStyle(sidebar); const sidebarHeight =
    sidebar.getBoundingClientRect().height; const viewportHeight = window.innerHeight; // Allow
    small margin for browser chrome/rounding expect(sidebarHeight).toBeGreaterThan(viewportHeight *
    0.95); // Verify Collections section is visible await
    expect(canvas.getByText('Collections')).toBeInTheDocument(); await expect(canvas.getByText('No
    collections yet')).toBeInTheDocument(); // Verify History section is visible await
    expect(canvas.getByText('History')).toBeInTheDocument(); await expect(canvas.getByText('No
    history yet')).toBeInTheDocument();
  {/snippet}
</Story>

<Story name="Collapsed">
  {#snippet template(_args: Record<string, any>)}
    <div class="h-screen w-full flex">
      <div class="w-0 h-full overflow-hidden transition-all duration-200 flex-shrink-0">
        <Sidebar />
      </div>
      <div class="flex-1 bg-background flex items-center justify-center text-muted-foreground">
        Sidebar is collapsed (0 width)
      </div>
    </div>
  {/snippet}

  {#snippet play({ canvasElement })}
    const canvas = within(canvasElement); const sidebar = canvas.getByTestId('sidebar'); // Verify
    sidebar is still in DOM (but collapsed) await expect(sidebar).toBeInTheDocument(); // Verify
    wrapper has width 0 (collapsed) const wrapper = sidebar.parentElement;
    expect(wrapper).toHaveClass('w-0');
  {/snippet}
</Story>
