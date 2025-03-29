<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { duelResultPopup, friendBrowserPopup } from "$lib/stores/uiStore";
	import { eloChange, duelResultTitle } from "$lib/stores/context-specific/duelResultStore";
	import DuelDivisionDisplay from "$lib/components/DuelDivisionDisplay.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { elo } from "$lib/stores/accountStore";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { Search } from "lucide-svelte";

	// Animate number starting from 0
	const animatedElo = tweened(0, {
		duration: 2000,
		easing: cubicOut,
	});

	$effect(() => {
		animatedElo.set($eloChange);
	});
</script>

{#if $duelResultPopup}
	<Popup slim={true}>
		<div class="popup-title">
			<h1 id="socialHeader">{$duelResultTitle}</h1>
		</div>
		<div class="eloChangeDisplay">
			<h1 class="eloChangeText">{$eloChange >= 0 ? "+" : ""}{$animatedElo.toFixed(0)} Elo</h1>
			<p>You now have {$elo} Elo.</p>
		</div>
		<DuelDivisionDisplay inPage={true} />
		<div class="infoBox">
			<img alt="info icon" class="infoIcon" src="/img/info_icon.png" />
			<p>To report a player, open their profile and click on "Report".</p>
			<button
				class="standardButton white growSearch"
				onclick={() => {
					playSound("basic_button");
					friendBrowserPopup.set(true);
				}}
			>
				Players <Search size={18} strokeWidth={3} style="margin-bottom: -4x; margin-left: 2px;" /></button
			>
		</div>
		<button
			class="standardButton closeButton white"
			onclick={() => {
				playSound("basic_button");
				duelResultPopup.set(false);
				eloChange.set(0); // Reset to make UI number animation start from 0 again
			}}>Close</button
		>
	</Popup>
{/if}

<style>
	.eloChangeDisplay {
		width: 100%;
		height: 100px;
		margin-bottom: var(--layout-margin);
		margin-top: var(--layout-margin);
		display: flex;
		border-radius: 10px;
		background-color: var(--box-color);
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		padding-top: 10px;
		padding-bottom: 10px;
	}

	.growSearch {
		flex-grow: 1;
	}

	.infoBox {
		padding: var(--box-margin-buttons);
		border-radius: 10px;
		background-color: var(--box-color);
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--box-margin-buttons);
	}

	.infoIcon {
		margin-left: 8px;
		margin-right: 0;
	}

	.infoBox p {
		opacity: 0.5;
		flex-grow: 3;
	}

	.eloChangeText {
		width: 100%;
		text-align: center;
	}
</style>
