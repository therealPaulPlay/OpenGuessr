<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { divisionMatchHistoryPopup, duelResultPopup } from "$lib/stores/uiStore";
	import { eloChange, duelResultTitle, tokenGain } from "$lib/stores/context-specific/duelResultStore";
	import DuelDivisionDisplay from "$lib/components/DuelDivisionDisplay.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { duelWinStreak, elo } from "$lib/stores/accountStore";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { Info, History, Flame } from "@lucide/svelte";
	import TokenRewardDisplay from "./TokenRewardDisplay.svelte";

	// Animate number starting from 0
	const animatedElo = tweened(0, {
		duration: 2000,
		easing: cubicOut,
	});

	$effect(() => {
		animatedElo.set($eloChange);
	});

	duelResultPopup.subscribe((value) => {
		if (!value) {
			$eloChange = 0;
			$tokenGain = 0;
		}
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
	<div class="duelResultFlex">
		<div class="resultBox">
			<Flame
				class="resultText"
				strokeWidth={2.75}
				size={25}
				style="margin-right: 2px; margin-bottom: -2px; opacity: {$duelWinStreak == 0 ? 0.5 : 1}"
			/>
			<h2 class="resultText" style:opacity={$duelWinStreak == 0 ? 0.5 : 1}>
				{$duelWinStreak}
			</h2>
		</div>
		<div class="resultBox">
			<h2 class="resultText">
				{$eloChange >= 0 ? "+" : "-"}&hairsp;{Math.abs($animatedElo.toFixed(0))} Elo
			</h2>
		</div>
		<TokenRewardDisplay tokens={$tokenGain} />
	</div>

	<DuelDivisionDisplay />
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
			History <History size={20} strokeWidth={2.25} style="margin-bottom: -3px; margin-left: 2px;" /></button
		>
	</div>
</Popup>

<style>
	.duelResultFlex {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		margin-bottom: var(--layout-margin);
	}

	.duelResultFlex div {
		min-width: 100px;
	}

	.resultBox {
		flex-grow: 1;
		flex-basis: 0%;
		height: 38px;
		flex-wrap: wrap;
		display: flex;
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		justify-content: center;
		align-items: center;
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
	}

	.growSearch {
		flex-grow: 1;
	}

	.infoBox {
		padding: var(--box-margin);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--box-margin);
		box-shadow: var(--box-shadow);
		margin-top: var(--layout-margin);
	}

	.infoBox p {
		opacity: 0.5;
		flex-grow: 3;
	}

	.resultText {
		text-align: center;
	}
</style>
