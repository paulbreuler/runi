<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Folder, History } from 'lucide-svelte';
</script>

<aside
  class="w-64 h-full border-r border-border bg-muted/30 flex flex-col transition-all duration-200"
  data-testid="sidebar"
>
  <Card.Root class="flex-1 rounded-none border-0 border-r bg-transparent">
    <Card.Header class="pb-2">
      <Card.Title class="text-sm font-semibold text-foreground">Collections</Card.Title>
    </Card.Header>
    <Card.Content>
      <div
        class="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
      >
        <Folder size={16} />
        <span>No collections yet</span>
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root class="flex-1 rounded-none border-0 border-r border-t bg-transparent">
    <Card.Header class="pb-2">
      <Card.Title class="text-sm font-semibold text-foreground">History</Card.Title>
    </Card.Header>
    <Card.Content>
      <div
        class="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
      >
        <History size={16} />
        <span>No history yet</span>
      </div>
    </Card.Content>
  </Card.Root>
</aside>
