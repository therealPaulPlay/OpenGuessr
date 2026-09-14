<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { divisionMatchHistoryPopup, duelResultPopup } from "$lib/stores/uiStore";
	import { eloChange, duelResultTitle, tokenGain } from "$lib/stores/context-specific/duelResultStore";
	import DuelDivisionDisplay from "$lib/components/DuelDivisionDisplay.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { duelWinStreak } from "$lib/stores/accountStore";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { Info, History, Flame } from "@lucide/svelte";
	import TokenRewardDisplay from "./TokenRewardDisplay.svelte";
	import { findDuel } from "$lib/logic/matchmakingLogic";
	import { historyForUserId } from "$lib/stores/context-specific/divisionMatchHistoryStore";

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
		<h1>{$duelResultTitle}</h1>
	</div>
	<div class="duel-result-flex">
		<div class="result-box">
			<Flame
				class="result-text"
				strokeWidth={2.75}
				size={25}
				style="margin-right: 2px; margin-bottom: -2px; opacity: {$duelWinStreak == 0 ? 0.5 : 1}"
			/>
			<h2 class="result-text" style:opacity={$duelWinStreak == 0 ? 0.5 : 1}>
				{$duelWinStreak}
			</h2>
		</div>
		<div class="result-box">
			<h2 class="result-text">
				{$eloChange >= 0 ? "+" : "-"}&hairsp;{Math.abs($animatedElo.toFixed(0))} Elo
			</h2>
		</div>
		<TokenRewardDisplay tokens={$tokenGain} />
	</div>

	<DuelDivisionDisplay />
	<div class="info-box">
		<div class="info-box-inner">
			<Info strokeWidth={2.25} size={22} color="white" style="opacity: 50%; flex-shrink: 0;" />
			<p>To report a player, open their profile and click on <i>Report</i>.</p>
		</div>
		<button
			class="standard-button white grow-search"
			onclick={() => {
				playSound("basic_button");
				$historyForUserId = localStorage.getItem("id");
				divisionMatchHistoryPopup.set(true);
			}}
		>
			History <History size={20} strokeWidth={2.25} style="margin-bottom: -2px; margin-left: 2px;" /></button
		>
	</div>
	<button
		class="standard-button bottom-button large-button"
		onclick={() => {
			playSound("basic_button");
			$duelResultPopup = false;
			findDuel();
		}}
	>
		Play again
	</button>
</Popup>

<style>
	.duel-result-flex {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		margin-bottom: var(--layout-margin);
	}

	.duel-result-flex div {
		min-width: 100px;
	}

	.result-box {
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

	.grow-search {
		flex-grow: 1;
	}

	.info-box {
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

	.info-box-inner {
		display: flex;
		gap: var(--box-margin);
		align-items: center;
		flex-grow: 100;
		padding-inline: var(--content-margin);
	}

	.info-box p {
		opacity: 0.5;
	}

	.result-text {
		text-align: center;
	}
</style>
