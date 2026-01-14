<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import MainLayout from './MainLayout.svelte';

  const { Story } = defineMeta({
    title: 'Layout/MainLayout',
    component: MainLayout,
    tags: ['autodocs'],
    parameters: {
      layout: 'fullscreen',
    },
    argTypes: {
      initialSidebarVisible: {
        control: 'boolean',
        description: 'Initial visibility state of the sidebar',
      },
    },
  });
</script>

<Story name="Default Layout" args={{ initialSidebarVisible: true }}>
  {#snippet template(args)}
    <MainLayout {...args}>
      {#snippet requestContent()}
        <div
          class="h-full p-4 flex items-center justify-center text-muted-foreground border-r border-border"
        >
          <div class="text-center">
            <p class="font-semibold text-foreground">Request Builder</p>
            <p class="text-sm">Left pane (50% default)</p>
          </div>
        </div>
      {/snippet}
      {#snippet responseContent()}
        <div class="h-full p-4 flex items-center justify-center text-muted-foreground">
          <div class="text-center">
            <p class="font-semibold text-foreground">Response Viewer</p>
            <p class="text-sm">Right pane (50% default)</p>
          </div>
        </div>
      {/snippet}
    </MainLayout>
  {/snippet}
</Story>

<Story name="Sidebar Collapsed" args={{ initialSidebarVisible: false }}>
  {#snippet template(args)}
    <MainLayout {...args}>
      {#snippet requestContent()}
        <div
          class="h-full p-4 flex items-center justify-center text-muted-foreground border-r border-border"
        >
          <div class="text-center">
            <p class="font-semibold text-foreground">Request Builder</p>
            <p class="text-sm">Sidebar collapsed, more space for content</p>
          </div>
        </div>
      {/snippet}
      {#snippet responseContent()}
        <div class="h-full p-4 flex items-center justify-center text-muted-foreground">
          <div class="text-center">
            <p class="font-semibold text-foreground">Response Viewer</p>
            <p class="text-sm">Press ⌘B to toggle sidebar</p>
          </div>
        </div>
      {/snippet}
    </MainLayout>
  {/snippet}
</Story>

<Story name="Narrow Panes">
  {#snippet template(args)}
    <MainLayout {...args}>
      {#snippet requestContent()}
        <div
          class="h-full p-4 flex items-center justify-center text-muted-foreground border-r border-border bg-muted/20"
        >
          <div class="text-center">
            <p class="font-semibold text-foreground">Request</p>
            <p class="text-xs">Drag divider to minimum (30%)</p>
          </div>
        </div>
      {/snippet}
      {#snippet responseContent()}
        <div class="h-full p-4 flex items-center justify-center text-muted-foreground bg-muted/20">
          <div class="text-center">
            <p class="font-semibold text-foreground">Response</p>
            <p class="text-xs">Both at minimum width</p>
          </div>
        </div>
      {/snippet}
    </MainLayout>
  {/snippet}
</Story>

<Story name="Wide Request">
  {#snippet template(args)}
    <MainLayout {...args}>
      {#snippet requestContent()}
        <div
          class="h-full p-4 flex items-center justify-center text-muted-foreground border-r border-border"
        >
          <div class="text-center">
            <p class="font-semibold text-foreground">Request Builder (expanded)</p>
            <p class="text-sm">Drag divider right to expand this pane to ~70%</p>
          </div>
        </div>
      {/snippet}
      {#snippet responseContent()}
        <div class="h-full p-4 flex items-center justify-center text-muted-foreground">
          <div class="text-center">
            <p class="font-semibold text-foreground">Response (narrow)</p>
            <p class="text-sm">~30% width</p>
          </div>
        </div>
      {/snippet}
    </MainLayout>
  {/snippet}
</Story>

<Story name="Wide Response">
  {#snippet template(args)}
    <MainLayout {...args}>
      {#snippet requestContent()}
        <div
          class="h-full p-4 flex items-center justify-center text-muted-foreground border-r border-border"
        >
          <div class="text-center">
            <p class="font-semibold text-foreground">Request (narrow)</p>
            <p class="text-sm">~30% width</p>
          </div>
        </div>
      {/snippet}
      {#snippet responseContent()}
        <div class="h-full p-4 flex items-center justify-center text-muted-foreground">
          <div class="text-center">
            <p class="font-semibold text-foreground">Response Viewer (expanded)</p>
            <p class="text-sm">Drag divider left to expand this pane to ~70%</p>
          </div>
        </div>
      {/snippet}
    </MainLayout>
  {/snippet}
</Story>
