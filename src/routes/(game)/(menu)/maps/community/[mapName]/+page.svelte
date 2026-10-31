<script>
	import MapPage from "$lib/components/MapPage.svelte";

	let { data } = $props();
</script>

<MapPage {data} isCommunity={true} />
