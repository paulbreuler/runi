<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Separator from './separator.svelte';

  const { Story } = defineMeta({
    title: 'Components/Separator',
    component: Separator,
    tags: ['autodocs'],
    argTypes: {
      orientation: {
        control: 'select',
        options: ['horizontal', 'vertical'],
      },
    },
  });
</script>

<Story name="Default" args={{ orientation: 'horizontal' }}>
  {#snippet template(args: Record<string, any>)}
    <Separator {...args} />
  {/snippet}
</Story>

<Story name="Horizontal" args={{ orientation: 'horizontal' }}>
  {#snippet template(args: Record<string, any>)}
    <Separator {...args} />
  {/snippet}
</Story>

<Story name="Vertical" args={{ orientation: 'vertical' }}>
  {#snippet template(args: Record<string, any>)}
    <div class="flex h-20">
      <Separator {...args} />
    </div>
  {/snippet}
</Story>
