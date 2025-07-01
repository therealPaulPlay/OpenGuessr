<script>
	import {
		mapModeIndicatorVisible,
		mapModeIndicatorText,
		leaveFunction,
		mapModeIndicatorFading,
		timerText,
	} from "$lib/stores/context-specific/mapModeIndicatorStore";
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { playSound } from "$lib/utils/soundManager";
	import { get } from "svelte/store";

	let mapModeTextContainer = $state();
	let mapModeTextElement = $state();
	let scrollModeText = $state(false);

	function checkMapmodeindicatorOverflow() {
		if (!mapModeTextContainer || !mapModeTextElement) return;

		let positionInfo = mapModeTextContainer.getBoundingClientRect();
		let width = positionInfo.width;
		scrollModeText =
			width < 150 || (width < 235 && $mapModeIndicatorText.length > 25) || (width < 295 && $mapModeIndicatorText.length > 31);

		if (scrollModeText) {
			const scrollDistance = mapModeTextElement.scrollWidth - width + 20;
			mapModeTextContainer.style.setProperty("--scroll-distance", `-${scrollDistance}px`);
		}
	}

	let resizeObserver;
	$effect(() => {
		if (resizeObserver) resizeObserver.disconnect();
		if (mapModeTextContainer) {
			try {
				resizeObserver = new ResizeObserver(checkMapmodeindicatorOverflow);
				resizeObserver.observe(mapModeTextContainer);
			} catch (error) {
				console.error("Error setting Resize Observer for MapModeIndicator: " + error);
			}
		}
	});
</script>

{#if $mapModeIndicatorVisible && !$resultScreenEnabled}
	<div class="barMenu mapModeIndicator" class:fading={Boolean($mapModeIndicatorFading)}>
		{#if $leaveFunction}
			<button
				class="standardButton"
				onclick={() => {
					playSound("leave_round");
					get(leaveFunction)();
				}}>Leave</button
			>
		{/if}
		<div bind:this={mapModeTextContainer} class="mapModeTextContainer" class:modeTextFade={scrollModeText}>
			<p
				bind:this={mapModeTextElement}
				class:modeTextScroll={scrollModeText}
				contenteditable="false"
			>
				{$mapModeIndicatorText}
			</p>
		</div>
		<p id="mapTimer" class="mapModeText modeTextRight {$mapModeIndicatorFading ? 'fading' : ''}">
			{$timerText}
		</p>
	</div>
{/if}

<style>
	.mapModeIndicator {
		pointer-events: auto;
		box-shadow: 0 2px 20px rgba(5, 6, 10, 0.3);
		width: 100%;
		transition:
			width 250ms ease,
			margin 250ms ease;
		z-index: 10;
		user-select: none;
		margin-top: var(--panel-margin);
		flex-shrink: 0;
		height: 40px;
		width: calc(100% - calc(var(--box-margin) + 6px));
	}

	:global(.mapModeIndicator.fading) {
		animation: divFade 1s infinite;
	}

	.mapModeTextContainer {
		margin-inline: 10px;
		overflow: hidden;
		white-space: nowrap;
		flex-grow: 1;
	}

	.modeTextFade {
		mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
	}

	.mapModeText {
		width: fit-content;
	}

	.modeTextRight {
		margin-left: auto;
		margin-right: var(--layout-margin);
	}

	@keyframes divFade {
		0% {
			background-color: var(--panel-color);
		}
		50% {
			background-color: hsla(298, 25%, 20%, 0.7);
		}
		100% {
			background-color: var(--panel-color);
		}
	}

	:global(.modeTextScroll) {
		animation: scrollModeText 5s ease-in-out infinite alternate;
	}

	@keyframes textFade {
		0% {
			color: white;
		}
		50% {
			color: red;
		}
		100% {
			color: white;
		}
	}

	#mapTimer {
		text-align: right;
		min-width: 40px;
	}

	#mapTimer.fading {
		animation: textFade 1s infinite;
	}

	@keyframes scrollModeText {
		0% {
			transform: translateX(5px);
		}
		100% {
			transform: translateX(var(--scroll-distance, -100%));
		}
	}
</style>
