<script>
	import { baseMaps, specialMaps } from "$lib/stores/context-specific/officialMapsStore";
	import { Plus } from "@lucide/svelte";

	let mapList = $derived([...$baseMaps, ...$specialMaps]);

    function offset(array, amount = 1) {
        const end = array.slice(-amount);
        array = [...end, ...array];
        console.log(array);
        return array;
    }
</script>

<div class="container">
	<!-- Angled infinitely flowing by maps -->
	<!-- 6 vertically stacked lines of flowing maps -->
	<div class="vertical-stack">
		{#each { length: 6 }, index}
			{@const shuffledMapList = offset([...mapList], index * 2)}
			<div class="horizontal-flex" style:margin-left={index * 15 + "px"}>
				<!-- Render the same shuffled row twice so translating by -50% loops it -->
				{#each [...shuffledMapList, ...shuffledMapList] as map}
					<div class="map">
						<img class="map-image" src={map.imgUrlTiny} alt="map cover" />
					</div>
				{/each}
			</div>
		{/each}
	</div>
	<!-- Plus in the center -->
	<div class="center-container">
		<Plus size={28} strokeWidth={1.75} style="filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1))" />
	</div>
</div>

<style>
	.container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: var(--content-margin);
		background: radial-gradient(rgba(192, 205, 255, 0.5), var(--dark-background));
	}

	.center-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		z-index: 1;
		background-color: rgba(0, 0, 0, 0.5);
	}

	.vertical-stack {
		display: flex;
		flex-direction: column;
		position: absolute;
		inset: 0;
		overflow: visible;
		gap: 3px;
		rotate: -15deg;
		width: 110%;
		height: 110%;
		margin-left: -55px;
        margin-top: -12px;
	}

	.horizontal-flex {
		display: flex;
		width: max-content;
	}

	.map {
		margin-right: 3px;
		background-color: var(--box-color-dark);
		padding: 2px;
		min-width: fit-content;
		display: grid;
		border-radius: var(--content-margin);
	}

	.map-image {
		width: 30px;
		aspect-ratio: 16/9;
		border-radius: 3px;
        pointer-events: none;
        user-select: none;
	}
</style>
