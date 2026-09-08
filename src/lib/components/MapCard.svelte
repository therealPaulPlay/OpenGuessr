<script>
	import { goto } from "$app/navigation";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { showProfile } from "$lib/utils/showProfile";
	import { playSound } from "$lib/utils/soundManager";
	import { blur } from "svelte/transition";

	let { map } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="map-item"
	in:blur|global
	onclick={() => {
		playSound("basic_button");
		goto("/maps/community/" + map.name);
	}}
	role="menu"
	tabindex="0"
>
	<h3 style:padding-inline="var(--content-margin)">{map.name}</h3>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<p
		class="author-name"
		style:padding-inline="var(--content-margin)"
		onclick={(e) => {
			e.stopPropagation();
			showProfile(map.authorId);
		}}
	>
		by {map.author}
	</p>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="description-box"
		onclick={(e) => {
			e.stopPropagation();
			showConfirmPopup("About", map.description);
		}}
	>
		<p style:opacity="0.75">{map.description?.length > 90 ? map.description.substring(0, 87) + "..." : map.description}</p>
	</div>
</div>

<style>
	.map-item {
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
		padding: var(--box-margin);
		display: flex;
		flex-direction: column;
		transition:
			scale 250ms ease,
			filter 250ms ease;
		cursor: pointer;
		flex-basis: 30%;
		flex-grow: 1;
		box-sizing: border-box;
	}

	.map-item h3 {
		text-wrap: nowrap;
	}

	.map-item:hover,
	.map-item:active {
		scale: 0.99;
		filter: brightness(0.7);
	}

	.author-name {
		opacity: 0.5;
		transition: opacity 250ms ease;
		overflow: hidden;
		text-overflow: ellipsis;
		width: fit-content;
		text-wrap: nowrap;
	}

	.author-name:hover {
		opacity: 0.25;
	}

	.description-box {
		border-radius: var(--content-margin);
		background-color: var(--box-color-dark);
		box-shadow: var(--box-shadow);
		margin-top: var(--box-margin);
		padding: var(--content-margin);
		padding-inline: var(--box-margin);
		cursor: pointer;
        flex-grow: 1;
	}
</style>
