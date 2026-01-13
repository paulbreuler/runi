<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import StatusBar from './StatusBar.svelte';

  const { Story } = defineMeta({
    title: 'Layout/StatusBar',
    component: StatusBar,
    tags: ['autodocs'],
    parameters: {
      layout: 'fullscreen',
    },
  });
</script>

<Story name="Default">
  {#snippet template(_args: Record<string, any>)}
    <div class="h-screen flex flex-col">
      <div class="flex-1 bg-background"></div>
      <StatusBar />
    </div>
  {/snippet}
</Story>

<Story name="With Environment">
  {#snippet template(_args: Record<string, any>)}
    <div class="h-screen flex flex-col">
      <div class="flex-1 bg-background flex items-center justify-center text-muted-foreground">
        Main content area
      </div>
      <StatusBar />
    </div>
  {/snippet}
</Story>
