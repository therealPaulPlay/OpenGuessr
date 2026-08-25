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
		slideupImageUrl,
		slideupNote,
		slideupContent,
		closeCallback,
	} from "$lib/stores/context-specific/resultScreenSlideupStore";
	import { playSound } from "$lib/utils/soundManager";
	import { HandHeart, TriangleAlert } from "@lucide/svelte";
	import { slide } from "svelte/transition";
</script>

{#if $showSlideup && !$crazyGames}
	<div class="endscreen-slideup-container bar-menu" in:slide|global out:slide>
		<div class="scrollable-content of-top of-bottom" style:margin-bottom="var(--panel-margin)">
			<div class="text-box text-box-top">
				<h3 id="slideup-title">{$slideupTitle}</h3>
				{#if $slideupTitle == "Meta"}
					<span class="geometas-attribution"
						>Powered by <a target="_blank" href="https://geometas.com">Geometas</a></span
					>
				{/if}
			</div>
			{#if $slideupButtonText == "Support"}
				<div class="text-box supporter-stat-box solid-box">
					<p class="supporter-stat-text">${$monthlySupportAmount ?? "..."} supported this month</p>
					<div class="supporter-stat-bar" style:width={Math.min(1, $monthlySupportAmount / 500) * 100 + "%"}></div>
				</div>
			{/if}
			{#if $slideupImageUrl}
				<div class="solid-box" style:padding="var(--box-margin)">
					<img alt="Meta" src={$slideupImageUrl} class="slideup-image" />
				</div>
			{/if}
			<div class="text-box solid-box" style:margin-top="var(--panel-margin)">
				{#if $slideupText}
					<p bind:textContent={$slideupText} contenteditable="false" class="of-top of-bottom"></p>
				{:else if $slideupContent}
					{@html $slideupContent}
				{/if}
			</div>
			{#if $slideupNote}
				<div class="text-box solid-box" style:margin-top="var(--panel-margin)">
					<p style:opacity="0.5" class="of-top of-bottom" style:max-height="100px">
						<TriangleAlert
							size={22}
							strokeWidth={2.25}
							style="margin-bottom: -2px; margin-right: var(--content-margin);"
						/>
						{$slideupNote}
					</p>
				</div>
			{/if}
			{#if $slideupButtonText == "Join"}
				<iframe
					class="discord-widget"
					title="Discord widget"
					width="300"
					height="300"
					allowtransparency="true"
					frameborder="0"
					src="https://discord.com/widget?id=1221841177863651499&theme=dark"
					sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
				></iframe>
			{/if}
		</div>
		<div class="button-box">
			<button
				class="standard-button white"
				style:width={!$slideupCallback ? "100%" : ""}
				onclick={() => {
					playSound("basic_button");
					$showSlideup = false;
					$closeCallback?.();
				}}>{$closeCallback ? "No, thanks" : "Close"}</button
			>
			{#if $slideupCallback}
				<button
					class="standard-button"
					class:green-button={$slideupButtonText == "Support"}
					class:purple-button={$slideupButtonText == "Join"}
					onclick={() => {
						playSound("basic_button");
						$slideupCallback?.();
					}}
				>
					{$slideupButtonText}
					{#if $slideupButtonText == "Support"}
						<HandHeart style="margin-bottom: -3px;" size={20} strokeWidth={2.25} />
					{:else if $slideupButtonText == "Join"}
						<img src="/img/discord.png" class="discord-icon-join" alt="Discord Icon" />
					{/if}
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.endscreen-slideup-container {
		z-index: 14;
		max-height: 1000px;
		pointer-events: auto;
		display: block;
		position: fixed;
		bottom: var(--box-margin);
		left: var(--box-margin);
		box-sizing: border-box;
	}

	.supporter-stat-text {
		opacity: 0.75;
	}

	.scrollable-content {
		width: 100%;
		max-height: max(150px, calc(100dvh - 200px));
		overflow-y: auto;
		scrollbar-width: none;
	}

	.text-box-top {
		margin-bottom: var(--panel-margin);
		padding: var(--content-margin) !important;
		padding-inline: var(--content-margin) !important;
	}

	.text-box {
		padding: var(--box-margin);
		padding-inline: calc(var(--panel-margin) + var(--content-margin));
	}

	.text-box p {
		max-height: 125px;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.solid-box {
		border-radius: var(--content-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		box-sizing: border-box;
		max-width: 300px;
	}

	.supporter-stat-box {
		margin-bottom: var(--panel-margin);
		position: relative;
		overflow: hidden;
		text-align: center;
	}

	.slideup-image {
		display: block;
		border-radius: 3px;
		height: 200px;
		max-width: 100%;
		object-fit: cover;
		user-select: none;
		pointer-events: none;
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
		gap: var(--panel-margin);
	}

	.button-box .standard-button {
		height: 42px;
	}

	.green-button {
		background-color: #00ac00;
	}

	.purple-button {
		background-color: #8e44f0;
	}

	.geometas-attribution {
		opacity: 0.5;
	}

	#slideup-title {
		transition: color 350ms ease;
		font-size: 25px;
	}

	.discord-icon-join {
		width: 20px;
		height: auto;
		vertical-align: -2px;
		margin-left: 3px;
	}

	.discord-widget {
		width: 100%;
		min-height: 250px;
		border-radius: var(--box-margin);
		margin-top: var(--panel-margin);
		/* Discord iframe content has weird slight offset to the bottom */
		margin-bottom: -3px;
	}

	@media (max-width: 500px) {
		.endscreen-slideup-container {
			width: calc(100% - var(--box-margin) * 2);
		}

		.solid-box {
			max-width: unset;
		}
	}
</style>
