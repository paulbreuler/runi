<script lang="ts">
    import Button from './button.svelte';
    import type { ButtonProps } from './button.svelte';

    interface Props extends ButtonProps {
        label: string;
    }

    let { label, ...restProps }: Props = $props();
</script>

<Button {...restProps}>{label}</Button>
