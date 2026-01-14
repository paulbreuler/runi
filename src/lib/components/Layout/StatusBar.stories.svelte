<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from '@storybook/test';
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
  
  {#snippet play({ canvasElement })}
    const canvas = within(canvasElement);
    const statusBar = canvas.getByTestId('status-bar');
    
    // Verify status bar is rendered
    await expect(statusBar).toBeInTheDocument();
    
    // Verify environment indicator displays
    await expect(canvas.getByText(/Environment:/)).toBeInTheDocument();
    await expect(canvas.getByText('default')).toBeInTheDocument();
    
    // Verify AI hint text displays
    await expect(canvas.getByText(/Press.*⌘I.*for AI assistance/)).toBeInTheDocument();
    
    // Check monospaced font is applied to environment value
    const envValue = canvas.getByText('default');
    const envStyle = window.getComputedStyle(envValue);
    expect(envStyle.fontFamily).toMatch(/mono/i);
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
  
  {#snippet play({ canvasElement })}
    const canvas = within(canvasElement);
    const statusBar = canvas.getByTestId('status-bar');
    
    // Verify status bar is rendered
    await expect(statusBar).toBeInTheDocument();
    
    // Verify all elements are visible
    await expect(canvas.getByText(/Environment:/)).toBeInTheDocument();
    await expect(canvas.getByText('default')).toBeInTheDocument();
    await expect(canvas.getByText(/Press.*⌘I.*for AI assistance/)).toBeInTheDocument();
    
    // Verify status bar has correct styling classes
    await expect(statusBar).toHaveClass('h-8', 'border-t', 'flex');
  {/snippet}
</Story>
