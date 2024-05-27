<script lang="ts">
	import { progressStore } from '../lib/storeDataHandler';
</script>

<div class="relative h-1 w-full bg-neutral-200 dark:bg-neutral-600">
	<div
		class="h-1 bg-orange-400 rounded-4"
		style="width: {($progressStore.current / $progressStore.total) * 100}%"
	></div>
</div>
