<script>
	import {
		shopPurchaseAnimation,
		shopAnimationImages,
		shopPurchaseAnimationTitle,
	} from "$lib/stores/context-specific/shopStore";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { playSound } from "$lib/utils/soundManager";
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";

	// Thank you window after purchase (shows when users return after successful checkout)
	onMount(() => {
		let urlParams = new URLSearchParams(window.location.search);

		try {
			const stripeSessionFinished = urlParams.get("payment-completed");
			if (stripeSessionFinished) {
				showConfirmPopup(
					"Thank you!",
					"Thank you for your purchase. People like you keep the game free and open for everyone.",
				);
				history.replaceState({}, document.title, window.location.pathname); // Reset query in the address bar
			}
		} catch {}
	});

	// Play shop purchase sound
	$effect(() => {
		if ($shopPurchaseAnimation) playSound("shop_purchase");
	});
</script>

<!-- Purchase animation for instantly redeemable items -->
{#if $shopPurchaseAnimation}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="purchase-animation-container"
		transition:blur={{ duration: 250 }}
		onclick={() => ($shopPurchaseAnimation = false)}
		role="alert"
	>
		<h1 class="purchase-animation-title">{$shopPurchaseAnimationTitle || "Default"}</h1>
		<div class="animation-item-container" transition:blur={{ duration: 250 }}>
			{#each $shopAnimationImages as src}
				<div class="animation-item-box">
					<img alt="purchased item" {src} class="animation-item-image" />
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
		backdrop-filter: blur(var(--normal-blur));
		background-color: var(--panel-color);
		gap: var(--layout-margin);
	}

	.animation-rays {
		width: 200lvmax;
		height: 200lvmax;
		background:
			repeating-conic-gradient(rgba(229, 80, 80, 0.1) 0deg 15deg, rgba(229, 80, 80, 0) 0deg 30deg),
			radial-gradient(25% 25% at 50% 50%, rgba(229, 80, 80, 0.6) 0, rgba(229, 80, 80, 0) 150%);
		animation: 10s rotate infinite linear;
		overflow: visible;
		pointer-events: none;
		position: fixed;
		transform-origin: center;
	}

	.animation-item-container {
		display: flex;
		gap: var(--layout-margin);
		justify-content: center;
		z-index: 2;
		flex-wrap: wrap;
		margin-inline: var(--layout-margin);
	}

	.animation-item-box {
		backdrop-filter: blur(var(--normal-blur));
		padding: var(--layout-margin);
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		box-shadow:
			0 0 50px rgba(0, 0, 0, 0.3),
			inset 0 0.1rem 5px hsla(0, 0%, 100%, 0.3),
			inset 0 -0.25rem 5px rgba(0, 0, 2, 0.15);
		position: relative;
		transition:
			scale 250ms ease,
			background-color 250ms ease;
	}

	.animation-item-box:hover {
		scale: 1.05;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.animation-item-image {
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

	.purchase-animation-title {
		mask-image: linear-gradient(to bottom, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.6) 100%);
		z-index: 1;
		filter: drop-shadow(0 0 5px var(--dark-shadow-color));
		text-align: center;
		margin-inline: var(--layout-margin);
	}
</style>
