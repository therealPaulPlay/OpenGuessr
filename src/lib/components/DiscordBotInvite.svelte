<script>
	import { discordBotUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { X } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";

	let show = $state(false);

	onMount(() => {
		if (localStorage.getItem("discordBotPromotion") == null) show = true;
	});
</script>

{#if show}
	<div class="invite-box bar-menu" transition:blur|global={{ duration: 150 }}>
		<img alt="Mascot sitting" src="/img/mascot_wave.png" class="mascot" />
		<p>Play with Guessy</p>
		<p style:opacity="0.5 !important">
			<a href={$discordBotUrl} target="_blank" class="invite-cta">Invite our bot</a> to a Discord server!
		</p>
		<button
			class="tooltip-close"
			onclick={() => {
				localStorage.setItem("discordBotPromotion", true);
				show = false;
			}}><X size={22} strokeWidth={2.25} /></button
		>
	</div>
{/if}

<style>
	.invite-box {
		position: absolute;
		left: var(--layout-margin);
		bottom: var(--layout-margin);
		flex-direction: column;
		align-items: start;
		text-align: start;
		max-width: 300px;
		gap: var(--content-margin);
		padding: var(--layout-margin);
	}

	.mascot {
		position: absolute;
		bottom: calc(100% - 27px);
		right: 20px;
		width: 90px;
		height: 90px;
		pointer-events: none;
		user-select: none;
	}

	.invite-cta:hover {
		cursor: pointer;
	}

	@media (max-width: 1600px) {
		.invite-box {
			display: none;
		}
	}
</style>
