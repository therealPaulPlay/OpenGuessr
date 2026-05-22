<script>
	import { teamAmount } from "$lib/stores/context-specific/multiplayerStore";
	import { playSound } from "$lib/utils/soundManager";
	import Tabs from "./ui/Tabs.svelte";
	// eslint-disable-next-line no-useless-assignment
	let { isTeamChat = $bindable(false), inPanel = true } = $props();

	// Revert if team amount changes to 1
	$effect(() => {
		if ($teamAmount <= 1) isTeamChat = false;
	});
</script>

{#if $teamAmount > 1}
	<div class:barMenu={inPanel} class:in-menu={!inPanel} class:no-bottom-border-radius={inPanel}>
		<Tabs
			tabs={["Global", "Team"]}
			onchange={(selection, _) => {
				playSound("basic_button");
				isTeamChat = selection === "Team";
			}}
		/>
	</div>
{/if}

<style>
	.in-menu {
		padding: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		width: fit-content;
	}

	.no-bottom-border-radius {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		margin-left: var(--panel-margin);
	}
</style>
