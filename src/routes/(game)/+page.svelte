<script>
	import AboutArticle from "$lib/components/AboutArticle.svelte";

	let { data } = $props();
</script>

<svelte:head>
	<title>OpenGuessr - Free GeoGuessr Alternative</title>
	{@html data.structuredData}
</svelte:head>

<!-- Prerendered copy of the about page for crawlers -->
<AboutArticle hidden />
