<script>
	import { playSound } from "$lib/utils/soundManager";
	import { Play, X } from "@lucide/svelte";
	import { leaveTutorial, startTutorial } from "./TutorialOverlay.svelte";
	import { countryGuessr, singleplayer } from "$lib/stores/modeStore";
	import { tutorial } from "$lib/stores/context-specific/tutorialStore";
	import { fly, slide } from "svelte/transition";
	import { mapHovered } from "$lib/stores/context-specific/mapStore";
	import { backIn, backOut } from "svelte/easing";

	let show = $state(false);
	let mapWasHoveredOnce = $state(false);

	$effect(() => {
		if ($mapHovered) mapWasHoveredOnce = true;
	});

	// Check for tutorial state & show note if applicable
	$effect(() => {
		if ($tutorial) show = false;
		else if (!localStorage.getItem("tutorialCompleted")) {
			// Temporary backwards-compatability guard (old, now removed menu introduction seen -> count as tutorial played)
			// TODO remove in 30 days
			if (localStorage.getItem("menuIntroduction")) {
				localStorage.setItem("tutorialCompleted", true);
				return;
			}

			show = true;
		}
	});
</script>

{#if show && $singleplayer && !$mapHovered && !$countryGuessr}
	<div class="note-wrapper">
		<img
			alt="welcome mascot"
			src="/img/tutorial/tutorial_welcome.png"
			class="welcome-image"
			in:fly={{ y: 15, delay: mapWasHoveredOnce ? 250 : 750, easing: backOut }}
			out:fly={{ y: 15, duration: $mapHovered ? 150 : undefined, easing: $mapHovered ? undefined : backIn }}
		/>
		<div
			class="bar-menu tutorial-note"
			in:slide={{ delay: mapWasHoveredOnce ? 250 : 750, easing: backOut }}
			out:slide={{ duration: $mapHovered ? 150 : undefined, easing: $mapHovered ? undefined : backIn }}
		>
			<div class="left-side of-left of-right">
				<p>New?<span style:opacity={0.75} style:margin-left="var(--content-margin);">Try the tutorial.</span></p>
			</div>
			<div class="right-side">
				<button
					class="standard-button dark close-button"
					aria-label="Close"
					onclick={() => {
						playSound("basic_button");
						show = false;
						leaveTutorial();
					}}
				>
					<X size={22} strokeWidth={2.25} />
				</button>
				<button
					class="standard-button white"
					aria-label="Play tutorial"
					style:padding-inline="var(--box-margin);"
					onclick={() => {
						playSound("basic_button");
						startTutorial();
					}}><Play size={22} strokeWidth={2.25} style="margin-bottom: -2px;" /></button
				>
			</div>
		</div>
	</div>
{/if}

<style>
	.note-wrapper {
		position: relative;
		width: 100%;
		z-index: -1;
	}

	.tutorial-note {
		width: 100%;
		box-sizing: border-box;
		margin-bottom: var(--box-margin);
	}

	.left-side {
		display: flex;
		align-items: center;
		gap: var(--content-margin);
		text-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: none;
		margin-left: calc(var(--layout-margin) - var(--panel-margin));
	}

	.right-side {
		margin-left: auto;
		display: flex;
		gap: var(--panel-margin);
	}

	.close-button {
		display: flex;
		align-items: center;
		padding-inline: var(--box-margin);
	}

	.welcome-image {
		position: absolute;
		top: -61px;
		right: max(115px, 32%);
		rotate: -3deg;
		transform: translateX(50%);
		height: 90px;
		width: 90px;
		pointer-events: none;
		z-index: 1;
		user-select: none;
	}
</style>
