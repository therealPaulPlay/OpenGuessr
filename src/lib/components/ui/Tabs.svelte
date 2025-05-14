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

<div class="tabs-group {className}">
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
		overflow: hidden;
		border: 3px solid rgba(255, 255, 255, 0.3);
		box-sizing: border-box;
		box-shadow: 0 3px 1px rgba(0, 0, 0, 0.1);
		transition: transform 150ms ease;
		max-width: 100%;
		max-height: 39px;
	}

	.tabs-group:has(button:active) {
		transform: scale(0.98);
	}

	.tab-button {
		opacity: 0.5;
		border: none;
		border-radius: 0;
		padding-top: 0;
		padding-bottom: 2px;
		outline: none;
		box-shadow: none;
		text-overflow: ellipsis;
		overflow: hidden;
		flex-grow: 1;
	}

	.tab-button:active {
		transform: none;
	}

	.tab-button.active {
		opacity: 1;
	}
</style>
