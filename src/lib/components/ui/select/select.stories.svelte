<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Select from './index';

  const { Story } = defineMeta({
    title: 'Components/Select',
    component: Select.Root,
    tags: ['autodocs'],
  });
</script>

<script lang="ts">
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];
</script>

<Story name="Default" args={{ value: 'option1' }}>
  {#snippet template(args: Record<string, any>)}
    {@const selectedValue = args.value ?? 'option1'}
    {@const triggerContent =
      options.find((opt) => opt.value === selectedValue)?.label ?? 'Select option'}
    <Select.Root type="single" value={selectedValue} disabled={args.disabled}>
      <Select.Trigger disabled={args.disabled}>{triggerContent}</Select.Trigger>
      <Select.Content>
        {#each options as option (option.value)}
          <Select.Item value={option.value}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  {/snippet}
</Story>

<Story name="WithValue" args={{ value: 'option2' }}>
  {#snippet template(args: Record<string, any>)}
    {@const selectedValue = args.value ?? 'option2'}
    {@const triggerContent =
      options.find((opt) => opt.value === selectedValue)?.label ?? 'Select option'}
    <Select.Root type="single" value={selectedValue} disabled={args.disabled}>
      <Select.Trigger disabled={args.disabled}>{triggerContent}</Select.Trigger>
      <Select.Content>
        {#each options as option (option.value)}
          <Select.Item value={option.value}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  {/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true }}>
  {#snippet template(args: Record<string, any>)}
    {@const selectedValue = args.value ?? 'option1'}
    {@const triggerContent =
      options.find((opt) => opt.value === selectedValue)?.label ?? 'Select option'}
    <Select.Root type="single" value={selectedValue} disabled={args.disabled}>
      <Select.Trigger disabled={args.disabled}>{triggerContent}</Select.Trigger>
      <Select.Content>
        {#each options as option (option.value)}
          <Select.Item value={option.value}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  {/snippet}
</Story>
