<script>
	let {
		name,
		imgUrl = null,
		author = null,
		selected = false,
		compact = false,
		slim = false,
		animate = false,
		onclick,
		loadMore = false,
		chip,
		cover,
		children,
	} = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="map-item standard-button white-soft"
	class:map-item-slim={slim}
	class:map-item-animate={animate}
	class:map-item-compact={compact}
	class:map-item-load-more={loadMore}
	class:selected-map-item={selected}
	role="button"
	tabindex="0"
	{onclick}
>
	{#if imgUrl}
		<img class="map-cover-image" src={imgUrl} alt="map cover" />
	{:else if cover}
		<div class="map-cover-placeholder">{@render cover()}</div>
	{/if}
	<div class="map-info" class:map-info-flex={chip}>
		<p class="map-name">{name}</p>
		{#if author}
			<p class="map-author">by {author}</p>
		{/if}
		{@render chip?.()}
	</div>
	{@render children?.()}
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.map-item {
		display: flex;
		flex-wrap: wrap;
		gap: var(--box-margin);
		justify-content: space-between;
		box-shadow: var(--panel-shadow);
		text-decoration: none;
		align-items: center;
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		box-sizing: border-box;
		text-align: start;
		min-width: 300px;
		flex-grow: 1;
		flex-basis: 30%;
		overflow: hidden;
		width: 100%;
		height: unset;
		border: none;
	}

	.map-item-animate {
		animation: fadeIn 250ms ease-in-out;
		flex-wrap: nowrap;
	}

	.map-item-slim {
		min-width: 150px;
		flex-basis: 15%;
	}

	.map-item-load-more {
		justify-content: center;
		gap: var(--content-margin);
		min-height: 71px;
	}

	.map-item-load-more .map-info {
		flex-grow: 0;
		padding-left: 0;
	}

	.selected-map-item {
		background-color: rgba(255, 255, 255, 0.25);
	}

	.map-cover-image {
		display: block;
		width: 100%;
		aspect-ratio: 16/9;
		object-fit: cover;
		border-radius: var(--content-margin);
		pointer-events: none;
		user-select: none;
	}

	.map-cover-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		aspect-ratio: 16/9;
		border-radius: var(--content-margin);
		background-color: rgba(255, 255, 255, 0.1);
	}

	.map-info {
		flex-grow: 1;
		padding-left: var(--content-margin);
		min-width: 0;
	}

	.map-info-flex {
		display: flex;
		gap: var(--box-margin);
		overflow: hidden;
		margin-top: calc(-1 * var(--box-margin));
		margin-bottom: calc(-1 * var(--box-margin));
		padding: var(--box-margin);
		padding-inline: inherit;
	}

	.map-name {
		font-size: 22px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.map-author {
		font-size: 20px;
		color: rgba(255, 255, 255, 0.5);
		overflow: hidden;
		max-width: 150px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.map-item-compact {
		flex-direction: column;
		flex-wrap: nowrap;
		align-items: stretch;
		justify-content: flex-start;
		gap: var(--content-margin);
		padding: var(--content-margin);
		min-width: 80px;
		flex-basis: 0;
		box-shadow: var(--button-shadow);
	}

	.map-item-compact .map-cover-image,
	.map-item-compact .map-cover-placeholder {
		flex-grow: 1;
		min-height: 0;
	}

	.map-item-compact .map-info {
		flex-grow: 0;
		padding-inline: var(--content-margin);
		padding-bottom: 2px;
	}
</style>
