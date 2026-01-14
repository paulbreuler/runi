<script lang="ts">
  import { getStatusColor } from '$lib/utils/http-colors';

  interface Props {
    /** HTTP status code */
    status: number;
    /** HTTP status text */
    statusText: string;
  }

  let { status, statusText }: Props = $props();

  // Derived
  const colorClass = $derived(getStatusColor(status));
</script>

<span
  class="font-semibold px-3 py-1.5 rounded-md text-sm transition-colors duration-200 {colorClass}"
  data-testid="status-badge"
>
  {status} {statusText}
</span>
