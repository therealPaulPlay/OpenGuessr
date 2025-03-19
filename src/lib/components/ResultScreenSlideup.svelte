<!-- Sliding up alert message for result screen (streak, support...) -->
<script>
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import {
		slideupText,
		slideupCallback,
		slideupTitle,
		showSlideup,
		slideupButtonText,
		slideupButtonDisabled,
		monthlySupportAmount,
	} from "$lib/stores/context-specific/resultScreenSlideupStore";
	import { playSound } from "$lib/utils/soundManager";
	import { HandHeart } from "lucide-svelte";
	import { slide } from "svelte/transition";
</script>

{#if $showSlideup && !$crazyGames}
	<div class="endscreenSlideupContainer barMenu" transition:slide>
		<div class="textBox textBoxTop">
			<h3 id="slideupTitle">{$slideupTitle}</h3>
		</div>
		{#if $slideupButtonText == "Support"}
			<div class="textBox supporterStatBox">
				<p class="supporterStatText">${$monthlySupportAmount ?? "..."} supported this month</p>
				<div class="supporterStatBar" style:width={Math.min(1, $monthlySupportAmount / 500) * 100 + "%"}></div>
			</div>
		{/if}
		<div class="textBox">
			<p id="slideupText" bind:innerHTML={$slideupText} contenteditable="false"></p>
		</div>
		<div class="buttonBox">
			<button
				class="standardButton white dismissButton"
				onclick={() => {
					playSound("basic_button");
					$showSlideup = false;
				}}>Close</button
			>
			<button
				class="streakButton standardButton"
				onclick={() => {
					playSound("basic_button");
					$slideupCallback?.();
				}}
				class:disabled={$slideupButtonDisabled}
			>
				{$slideupButtonText}
				{#if $slideupButtonText == "Restore"}
					<img src="/img/streak_icon.png" class="socialIcon streakIcon" alt="Streak Icon" />
				{:else if $slideupButtonText == "Support"}
					<HandHeart style="margin-bottom: -3px;" size={20} />
				{/if}
			</button>
		</div>
	</div>
{/if}

<style>
	.endscreenSlideupContainer {
		z-index: 16;
		padding: 8px;
		border-radius: 10px;
		max-height: 1000px;
		transition: filter 250ms ease;
		user-select: none;
		overflow: hidden;
		pointer-events: auto;
		display: block;
		position: fixed;
		bottom: 10px;
		left: 10px;
	}

	.supporterStatText {
		opacity: 0.75;
	}

	.disabled {
		pointer-events: none;
		opacity: 0.5;
	}

	.textBoxTop {
		margin-bottom: 10px;
	}

	.textBox {
		padding: 10px;
		padding-inline: 12px;
		border-radius: 5px;
		background-color: var(--box-color);
	}

	.supporterStatBox {
		margin-bottom: 10px;
		position: relative;
		overflow: hidden;
		text-align: center;
	}

	.supporterStatBar {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.15);
	}

	.buttonBox {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-top: 10px;
		gap: 8px;
	}

	.buttonBox .standardButton {
		height: 42px;
	}

	.dismissButton {
		background-color: var(--panel-button-color);
	}

	.streakIcon {
		vertical-align: -4px !important;
	}

	.streakButton {
		background-color: #00ac00;
	}

	#slideupText {
		width: 100%;
		max-width: 300px;
	}

	#slideupTitle {
		transition: color 350ms ease;
		font-size: 25px;
	}

	@media (max-width: 500px) {
		.endscreenSlideupContainer {
			width: calc(100% - 36px);
		}
	}
</style>
