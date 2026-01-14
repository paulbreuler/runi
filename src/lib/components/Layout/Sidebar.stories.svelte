<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
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
  {#snippet template(_args)}
    <div class="h-screen w-full flex">
      <div class="h-full shrink-0">
        <Sidebar />
      </div>
      <div class="flex-1 bg-background flex items-center justify-center text-muted-foreground">
        Main content area
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Collapsed">
  {#snippet template(_args)}
    <div class="h-screen w-full flex">
      <div class="w-0 h-full overflow-hidden transition-all duration-200 shrink-0">
        <Sidebar />
      </div>
      <div class="flex-1 bg-background flex items-center justify-center text-muted-foreground">
        Sidebar is collapsed (0 width)
      </div>
    </div>
  {/snippet}
</Story>
