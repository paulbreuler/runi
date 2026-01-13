<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Input from './input.svelte';

  const { Story } = defineMeta({
    title: 'Components/Input',
    component: Input,
    tags: ['autodocs'],
    argTypes: {
      type: {
        control: 'select',
        options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      },
      disabled: {
        control: 'boolean',
      },
    },
  });
</script>

<Story name="Default" args={{}}>
  {#snippet template(args: Record<string, any>)}
    <Input {...args} />
  {/snippet}
</Story>

<Story name="WithPlaceholder" args={{ placeholder: 'Enter text...' }}>
  {#snippet template(args: Record<string, any>)}
    <Input {...args} />
  {/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true, value: 'Disabled input' }}>
  {#snippet template(args: Record<string, any>)}
    <Input {...args} />
  {/snippet}
</Story>

<Story name="Invalid" args={{ 'aria-invalid': true, value: 'Invalid input' }}>
  {#snippet template(args: Record<string, any>)}
    <Input {...args} />
  {/snippet}
</Story>

<Story name="Email" args={{ type: 'email', placeholder: 'email@example.com' }}>
  {#snippet template(args: Record<string, any>)}
    <Input {...args} />
  {/snippet}
</Story>

<Story name="Password" args={{ type: 'password', placeholder: 'Password' }}>
  {#snippet template(args: Record<string, any>)}
    <Input {...args} />
  {/snippet}
</Story>

<Story name="Number" args={{ type: 'number', placeholder: '123' }}>
  {#snippet template(args: Record<string, any>)}
    <Input {...args} />
  {/snippet}
</Story>
