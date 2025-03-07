<!-- Sliding up alert message for result screen (streak, support...) -->
<script>
	import {
		slideupText,
		slideupCallback,
		slideupTitle,
		showSlideup,
		slideupButtonText,
		slideupButtonDisabled,
		slideupTitleColor,
	} from "$lib/stores/context-specific/resultScreenSlideupStore";
	import { playSound } from "$lib/utils/soundManager";
	import { slide } from "svelte/transition";
</script>

{#if $showSlideup}
	<div class="endscreenSlideupContainer barMenu" transition:slide>
		<div class="textBox">
			<h3 id="slideupTitle" style:color={$slideupTitleColor}>{$slideupTitle}</h3>
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
				<img src="/img/streak_icon.png" class="socialIcon streakIcon" alt="Streak Icon" />
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

	.disabled {
		pointer-events: none;
		opacity: 0.5;
	}

	.textBox {
		padding: 10px;
		padding-inline: 12px;
		border-radius: 5px;
		background-color: var(--box-color);
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
		background-color: #01a001;
	}

	#slideupText {
		width: 100%;
		max-width: 300px;
	}

	#slideupTitle {
		transition: color 350ms ease;
		margin-bottom: 5px;
		font-size: 25px;
	}

	@media (max-width: 500px) {
		.endscreenSlideupContainer {
			width: calc(100% - 36px);
		}
	}
</style>
