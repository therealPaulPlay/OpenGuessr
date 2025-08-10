<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { divisionMatchHistoryPopup, duelResultPopup } from "$lib/stores/uiStore";
	import { eloChange, duelResultTitle } from "$lib/stores/context-specific/duelResultStore";
	import DuelDivisionDisplay from "$lib/components/DuelDivisionDisplay.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { elo } from "$lib/stores/accountStore";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { Info, History } from "lucide-svelte";

	// Animate number starting from 0
	const animatedElo = tweened(0, {
		duration: 2000,
		easing: cubicOut,
	});

	$effect(() => {
		animatedElo.set($eloChange);
	});

	duelResultPopup.subscribe((value) => {
		if (!value) $eloChange = 0;
	});
</script>

<Popup
	slim={true}
	bind:open={$duelResultPopup}
	onclick={() => {
		eloChange.set(0); // Reset to make UI number animation start from 0 again
	}}
>
	<div class="popup-title">
		<h1 id="socialHeader">{$duelResultTitle}</h1>
	</div>
	<div class="duelResultScroll of-top of-bottom">
		<div class="eloChangeDisplay">
			<h1 class="eloChangeText">{$eloChange >= 0 ? "+" : ""}{$animatedElo.toFixed(0)} Elo</h1>
			<p>You now have {$elo} Elo.</p>
		</div>
		<DuelDivisionDisplay inPage={true} />
		<div class="infoBox">
			<Info
				strokeWidth={2.25}
				size={24}
				color="white"
				style="opacity: 50%; margin-left: 5px; margin-right: 2px; margin-top: 2px;"
			/>
			<p>To report a player, open their profile and click on <i>Report</i>.</p>
			<button
				class="standardButton white growSearch"
				onclick={() => {
					playSound("basic_button");
					divisionMatchHistoryPopup.set(true);
				}}
			>
				History <History size={20} strokeWidth={2.5} style="margin-bottom: -3px; margin-left: 2px;" /></button
			>
		</div>
	</div>
</Popup>

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
		box-shadow: var(--box-shadow);
	}

	.growSearch {
		flex-grow: 1;
	}

	.duelResultScroll {
		max-height: calc(100dvh - 250px);
		overflow-y: auto;
	}

	.infoBox {
		padding: var(--box-margin);
		border-radius: 10px;
		background-color: var(--box-color);
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--box-margin);
		box-shadow: var(--box-shadow);
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
