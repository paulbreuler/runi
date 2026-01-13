<script lang="ts">
    import Button from './button.svelte';
    import type { ButtonProps } from './button.svelte';

    interface Props extends ButtonProps {
        children?: import('svelte').Snippet;
    }

    let { children, ...restProps }: Props = $props();
</script>

<Button {...restProps}>{@render children?.()}</Button>
