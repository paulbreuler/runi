<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils';

  type CardDescriptionProps = WithElementRef<HTMLAttributes<HTMLParagraphElement>> & {
    children?: Snippet;
  };

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: CardDescriptionProps = $props();
</script>

<p
  bind:this={ref}
  data-slot="card-description"
  class={cn('text-muted-foreground text-sm', className)}
  {...restProps}
>
  {@render children?.()}
</p>
