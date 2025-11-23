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
	import { Flame, HandHeart } from "@lucide/svelte";
	import { slide } from "svelte/transition";
</script>

{#if $showSlideup && !$crazyGames}
	<div class="endscreenSlideupContainer barMenu" transition:slide>
		<div class="textBox textBoxTop">
			<h3 id="slideupTitle">{$slideupTitle}</h3>
		</div>
		{#if $slideupButtonText == "Support"}
			<div class="textBox supporterStatBox solidBox">
				<p class="supporterStatText">${$monthlySupportAmount ?? "..."} supported this month</p>
				<div class="supporterStatBar" style:width={Math.min(1, $monthlySupportAmount / 500) * 100 + "%"}></div>
			</div>
		{/if}
		<div class="textBox solidBox">
			<p id="slideupText" bind:innerHTML={$slideupText} contenteditable="false"></p>
		</div>
		<div class="buttonBox">
			<button
				class="standardButton white"
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
				disabled={$slideupButtonDisabled}
			>
				{$slideupButtonText}
				{#if $slideupButtonText == "Restore"}
					<Flame size={22} strokeWidth={2.25} style="margin-bottom: -2px;" />
				{:else if $slideupButtonText == "Support"}
					<HandHeart style="margin-bottom: -3px;" size={20} strokeWidth={2.25} />
				{/if}
			</button>
		</div>
	</div>
{/if}

<style>
	.endscreenSlideupContainer {
		z-index: 16;
		padding: var(--panel-margin);
		border-radius: var(--box-margin);
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

	.textBoxTop {
		margin-bottom: var(--panel-margin);
		padding: 5px !important;
		padding-inline: 5px !important;
	}

	.textBox {
		padding: 10px;
		padding-inline: 12px;
	}

	.solidBox {
		border-radius: 5px;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
	}

	.supporterStatBox {
		margin-bottom: var(--panel-margin);
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
		box-shadow: var(--bulb-shadow);
	}

	.buttonBox {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-top: var(--panel-margin);
		gap: var(--panel-margin);
	}

	.buttonBox .standardButton {
		height: 42px;
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
