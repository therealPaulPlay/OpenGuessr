<script>
	import { playSound } from "$lib/utils/soundManager";
	import { ChevronDown } from "@lucide/svelte";
	import { slide, fade } from "svelte/transition";

	let {
		title,
		isOpen = $bindable(false),
		children,
		class: className = "",
		inPage = true
	} = $props();
</script>

<div class="drawer-container {className}" style:border-radius={inPage ? "var(--layout-margin)" : "var(--box-margin)"}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="drawer-toggle"
		role="button"
		tabindex={0}
		onclick={() => {
			playSound("floating_button");
			isOpen = !isOpen;
		}}
	>
		<p style:margin-left="var(--panel-margin)">{title}</p>
		<div class="drawer-icon">
			<ChevronDown
				style="margin-bottom: -4px; transition: transform 250ms ease; {isOpen ? 'transform: rotate(180deg)' : ''}"
			/>
		</div>
	</div>
	{#if isOpen}
		<div transition:slide={{ duration: 250 }} style:width={"100%"} style:margin-top={"var(--box-margin)"}>
			<div transition:fade={{ duration: 250 }} class="drawer-content">
				{@render children()}
			</div>
		</div>
	{/if}
</div>

<style>
	.drawer-container {
		width: calc(100% - 20px);
		background-color: var(--box-color);
		margin-bottom: var(--layout-margin);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
	}

	.drawer-toggle {
		display: flex;
		width: 100%;
		gap: var(--box-margin);
		transition: opacity 250ms ease;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
	}

	.drawer-icon {
		color: white;
		padding: 5px;
		padding-inline: var(--panel-margin);
	}

	.drawer-toggle:hover {
		opacity: 0.5;
	}

	.drawer-content {
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
		width: 100%;
	}
</style>
