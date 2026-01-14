<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn, type WithElementRef } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  type CardActionProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    children?: Snippet;
  };

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: CardActionProps = $props();
</script>

<div
  bind:this={ref}
  data-slot="card-action"
  class={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
  {...restProps}
>
  {@render children?.()}
</div>
