<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn, type WithElementRef } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  type CardFooterProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    children?: Snippet;
  };

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: CardFooterProps = $props();
</script>

<div
  bind:this={ref}
  data-slot="card-footer"
  class={cn('flex items-center px-6 [.border-t]:pt-6', className)}
  {...restProps}
>
  {@render children?.()}
</div>
