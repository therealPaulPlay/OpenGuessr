<!-- Sliding up alert message for result screen (streak, support...) -->
<script>
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import {
		slideupText,
		slideupCallback,
		slideupTitle,
		showSlideup,
		slideupButtonText,
		monthlySupportAmount,
	} from "$lib/stores/context-specific/resultScreenSlideupStore";
	import { playSound } from "$lib/utils/soundManager";
	import { Flame, HandHeart } from "@lucide/svelte";
	import { slide } from "svelte/transition";
</script>

{#if $showSlideup && !$crazyGames}
	<div class="endscreen-slideup-container bar-menu" transition:slide>
		<div class="text-box text-box-top">
			<h3 id="slideup-title">{$slideupTitle}</h3>
		</div>
		{#if $slideupButtonText == "Support"}
			<div class="text-box supporter-stat-box solid-box">
				<p class="supporter-stat-text">${$monthlySupportAmount ?? "..."} supported this month</p>
				<div class="supporter-stat-bar" style:width={Math.min(1, $monthlySupportAmount / 500) * 100 + "%"}></div>
			</div>
		{/if}
		<div class="text-box solid-box">
			<p id="slideup-text" bind:textContent={$slideupText} contenteditable="false"></p>
		</div>
		<div class="button-box">
			<button
				class="standard-button white"
				style:width={!$slideupCallback ? "100%" : ""}
				onclick={() => {
					playSound("basic_button");
					$showSlideup = false;
				}}>Close</button
			>
			{#if $slideupCallback}
				<button
					class="streak-button standard-button"
					onclick={() => {
						playSound("basic_button");
						$slideupCallback?.();
					}}
				>
					{$slideupButtonText}
					{#if $slideupButtonText == "Restore"}
						<Flame size={22} strokeWidth={2.25} style="margin-bottom: -2px;" />
					{:else if $slideupButtonText == "Support"}
						<HandHeart style="margin-bottom: -3px;" size={20} strokeWidth={2.25} />
					{/if}
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.endscreen-slideup-container {
		z-index: 14;
		padding: var(--panel-margin);
		border-radius: var(--box-margin);
		max-height: 1000px;
		transition: filter 250ms ease;
		user-select: none;
		overflow: hidden;
		pointer-events: auto;
		display: block;
		position: fixed;
		bottom: var(--box-margin);
		left: var(--box-margin);
	}

	.supporter-stat-text {
		opacity: 0.75;
	}

	.text-box-top {
		margin-bottom: var(--panel-margin);
		padding: var(--content-margin) !important;
		padding-inline: var(--content-margin) !important;
	}

	.text-box {
		padding: var(--box-margin);
		padding-inline: 12px;
	}

	.solid-box {
		border-radius: var(--content-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
	}

	.supporter-stat-box {
		margin-bottom: var(--panel-margin);
		position: relative;
		overflow: hidden;
		text-align: center;
	}

	.supporter-stat-bar {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.15);
		box-shadow: var(--bulb-shadow);
		transition: width 250ms ease;
	}

	.button-box {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-top: var(--panel-margin);
		gap: var(--panel-margin);
	}

	.button-box .standard-button {
		height: 42px;
	}

	.streak-button {
		background-color: #00ac00;
	}

	#slideup-text {
		width: 100%;
		max-width: 300px;
	}

	#slideup-title {
		transition: color 350ms ease;
		font-size: 25px;
	}

	@media (max-width: 500px) {
		.endscreen-slideup-container {
			width: calc(100% - 36px);
		}
	}
</style>
