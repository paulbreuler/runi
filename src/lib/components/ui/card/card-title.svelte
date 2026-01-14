<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils';

  type CardTitleProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    children?: Snippet;
  };

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: CardTitleProps = $props();
</script>

<div
  bind:this={ref}
  data-slot="card-title"
  class={cn('leading-none font-semibold', className)}
  {...restProps}
>
  {@render children?.()}
</div>
