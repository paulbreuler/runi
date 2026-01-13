<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from './Button.svelte';

  const { Story } = defineMeta({
    title: 'UI/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
      variant: {
        control: 'select',
        options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      },
      size: {
        control: 'select',
        options: ['default', 'sm', 'lg', 'icon'],
      },
    },
  });
</script>

<Story name="Default" args={{}}>
  {#snippet template(args: Record<string, any>)}
    <Button {...args}>Click me</Button>
  {/snippet}
</Story>

<Story name="Destructive" args={{ variant: 'destructive' }}>
  {#snippet template(args: Record<string, any>)}
    <Button {...args}>Delete</Button>
  {/snippet}
</Story>

<Story name="Outline" args={{ variant: 'outline' }}>
  {#snippet template(args: Record<string, any>)}
    <Button {...args}>Outline</Button>
  {/snippet}
</Story>

<Story name="Secondary" args={{ variant: 'secondary' }}>
  {#snippet template(args: Record<string, any>)}
    <Button {...args}>Secondary</Button>
  {/snippet}
</Story>

<Story name="Ghost" args={{ variant: 'ghost' }}>
  {#snippet template(args: Record<string, any>)}
    <Button {...args}>Ghost</Button>
  {/snippet}
</Story>

<Story name="Link" args={{ variant: 'link' }}>
  {#snippet template(args: Record<string, any>)}
    <Button {...args}>Link</Button>
  {/snippet}
</Story>

<Story name="Small" args={{ size: 'sm' }}>
  {#snippet template(args: Record<string, any>)}
    <Button {...args}>Small</Button>
  {/snippet}
</Story>

<Story name="Large" args={{ size: 'lg' }}>
  {#snippet template(args: Record<string, any>)}
    <Button {...args}>Large</Button>
  {/snippet}
</Story>

<Story name="All Variants" args={{}}>
  {#snippet template(_args: Record<string, any>)}
    <div class="flex gap-4 flex-wrap">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  {/snippet}
</Story>
