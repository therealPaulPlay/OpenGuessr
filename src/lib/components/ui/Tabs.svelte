<script>
	let {
		tabs = [],
		selectedIndex = $bindable(0),
		selected = $bindable(tabs[selectedIndex || 0]), // Bindable selected tab as a prop
		onchange,
		class: className = "", // Alias for HTML class attribute
	} = $props();

	// Handle tab selection
	function selectTab(tab) {
		selected = tab;
		selectedIndex = tabs.findIndex((e) => e == tab);
		onchange?.(selected, selectedIndex);
	}
</script>

<div class="tabs-group standardButton {className}">
	{#each tabs as tab, i}
		<button class="tab-button standardButton white {selected === tab ? 'active' : ''}" onclick={() => selectTab(tab)}>
			{tab}
		</button>
	{/each}
</div>

<style>
	.tabs-group {
		border-radius: 5px;
		width: fit-content;
		display: flex;
		box-sizing: border-box;
		max-width: 100%;
		height: 40px;
		background-color: transparent;
		border: 3px solid rgba(255, 255, 255, 0.3);
		box-shadow: var(--button-shadow);
		pointer-events: none;
		padding: 0;
		overflow: hidden;
	}

	.tabs-group:hover {
		scale: 1;
	}

	.tabs-group:has(button:active) {
		transform: scale(0.98);
	}

	.tab-button {
		opacity: 0.5;
		border: none;
		border-radius: 0;
		padding-top: 0;
		padding-bottom: 0;
		height: 34px;
		outline: none;
		text-overflow: ellipsis;
		overflow: hidden;
		flex-grow: 1;
		box-shadow: none !important;
		pointer-events: auto;
	}

	.tab-button::after {
		display: none;
	}

	.tab-button:active {
		transform: none;
	}

	.tab-button.active {
		opacity: 1;
		background-color: rgba(255, 255, 255, 0.2);
	}
</style>
