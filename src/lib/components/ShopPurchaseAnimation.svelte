<script>
	import {
		shopPurchaseAnimation,
		shopAnimationImages,
		shopPurchaseAnimationTitle,
	} from "$lib/stores/context-specific/shopStore";
	import { blur } from "svelte/transition";
</script>

<!-- Purchase animation -->
{#if $shopPurchaseAnimation}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="purchase-animation-container"
		transition:blur={{ duration: 250 }}
		onclick={() => ($shopPurchaseAnimation = false)}
		role="alert"
	>
		<h1 class="purchaseAnimationTitle">{$shopPurchaseAnimationTitle || "Default"}</h1>
		<div class="animationItemContainer" transition:blur={{ duration: 250 }}>
			{#each $shopAnimationImages as src}
				<div class="animationItemBox">
					<img alt="purchased item" {src} class="animationItemImage" />
				</div>
			{/each}
		</div>
		<div class="animation-rays"></div>
	</div>
{/if}

<style>
	.purchase-animation-container {
		z-index: 990;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		backdrop-filter: blur(10px);
		background-color: var(--panel-color);
		gap: var(--layout-margin);
	}

	.animation-rays {
		width: 200lvmax;
		height: 200lvmax;
		background: repeating-conic-gradient(rgba(229, 80, 80, 0.1) 0deg 15deg, rgba(229, 80, 80, 0) 0deg 30deg),
			radial-gradient(25% 25% at 50% 50%, rgba(229, 80, 80, 0.6) 0, rgba(229, 80, 80, 0) 150%);
		animation: 10s rotate infinite linear;
		overflow: visible;
		pointer-events: none;
		position: fixed;
		transform-origin: center;
	}

	.animationItemContainer {
		display: flex;
		gap: var(--layout-margin);
		justify-content: center;
		z-index: 2;
		flex-wrap: wrap;
		margin-inline: var(--layout-margin);
	}

	.animationItemBox {
		backdrop-filter: blur(10px);
		padding: var(--layout-margin);
		background-color: var(--box-color);
		border-radius: 10px;
		box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);
		border: 3px solid var(--box-color);
		position: relative;
		transition:
			scale 250ms ease,
			background-color 250ms ease;
	}

	.animationItemBox:hover {
		scale: 1.05;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.animationItemImage {
		width: 50px;
		height: 50px;
	}

	@keyframes rotate {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.purchaseAnimationTitle {
		mask-image: linear-gradient(to bottom, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.6) 100%);
		z-index: 1;
		filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.25));
		text-align: center;
		margin-inline: var(--layout-margin);
	}
</style>
