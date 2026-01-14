<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils';

  type CardProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    children?: Snippet;
  };

  let { ref = $bindable(null), class: className, children, ...restProps }: CardProps = $props();
</script>

<div
  bind:this={ref}
  data-slot="card"
  class={cn(
    'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
