<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { initializeRewardedAd } from "$lib/utils/rewardedAds";
	import { supporterLevel, supportedAmount } from "$lib/stores/accountStore";
	import { supporterPopupVisible } from "$lib/stores/context-specific/supporterPopupStore";
	import { onMount } from "svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { CircleArrowDown, CircleArrowUp, CircleMinus, CirclePlus, Clock9 } from "lucide-svelte";
	import { getStripe } from "$lib/utils/getStripe";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import TitleSeparator from "./ui/TitleSeparator.svelte";

	const basePrices = [3.99, 6.99, 19.99];

	function getTierPrice(tier) {
		if ($supporterLevel >= tier) return "Unlocked";
		if ($supporterLevel == 0) return "$ " + basePrices[tier - 1];
		return "$ " + Math.round(Math.max(basePrices[tier - 1] - $supportedAmount - 0.01, 0) * 100) / 100;
	}

	// Function to handle buy button click
	async function handleBuyClick(productId) {
		const stripe = await getStripe();

		try {
			const id = localStorage.getItem("id");

			// Call the server to create a Checkout Session
			const response = await fetch($accountUrl + "/stripe/create-checkout-session", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + localStorage.getItem("bearer"),
				},
				body: JSON.stringify({ productId, id }),
			});

			const { sessionId } = await response.json();

			// Redirect to Stripe Checkout
			const result = await stripe.redirectToCheckout({
				sessionId: sessionId,
			});

			if (result.error) throw new Error(result.error);
		} catch (error) {
			console.error("Error occured during checkout:", error);
			errorPopup("Checkout error", "Failed to create the checkout session.", error, false, false);
		}
	}

	function startPurchase(productId) {
		if ($crazyGames) return errorPopup("Not supported", "Purchases on this platform are not supported.");
		handleBuyClick("supporter_tier_" + productId);
		playSound("basic_button");
	}

	// Thank you window after purchase
	onMount(() => {
		let urlParams = new URLSearchParams(window.location.search);
		let stripeSessionFinished;

		try {
			stripeSessionFinished = urlParams.get("payment-completed");
			if (stripeSessionFinished) {
				showConfirmPopup(
					"Thank you!",
					"Thank you for your purchase! People like you keep the game free and open for everyone.",
				);
				history.replaceState({}, document.title, window.location.pathname); // Reset query in the address bar
			}
		} catch {}
	});
</script>

<Popup z={971} slim={true} bind:open={$supporterPopupVisible}>
	<div class="popup-title">
		<h1>Supporter</h1>
	</div>
	<div class="supporterBoxFlex">
		<div class="tierBoxLarge">
			<div class="tierBoxLargeTier"><p>Tier 2</p></div>
			<div class="tierBoxDisplay">
				<h2 class="tierBoxLargeHeader">
					One-time purchase, <span style:opacity={0.75} style="font-size: inherit;"><br />enjoy forever.</span>
				</h2>
				<ul class="tierBenefits tierBenefitsLarge">
					<div class="tierBenefitsScroll of-top of-bottom of-length-2">
						<li><CirclePlus size={20} style="margin-right: 10px; margin-bottom: -2px;" />Ad-free experience</li>
						<li><CirclePlus size={20} style="margin-right: 10px; margin-bottom: -2px;" />15% XP boost</li>
						<li><CirclePlus size={20} style="margin-right: 10px; margin-bottom: -2px;" />Supporter Pin</li>
						<li><CirclePlus size={20} style="margin-right: 10px; margin-bottom: -2px;" />Tier 2 Badge</li>
						<li><CirclePlus size={20} style="margin-right: 10px; margin-bottom: -2px;" />Highlighted name</li>
					</div>
				</ul>
				<button
					id="tierPrice2"
					class="standardButton tierBuyButton tierBuyButtonDisplay"
					onclick={() => startPurchase(2)}
					class:tierBuyButtonUnlocked={$supporterLevel >= 2}
					>{getTierPrice(2)}
					{#if $supporterLevel >= 1 && $supporterLevel < 2}
						<span class="discountBadge">Upgrade</span>
					{/if}
				</button>
			</div>
			<img alt="supporter perks" class="supporterPerksImage" src="/img/supporter_graphic.png" />
		</div>
		<TitleSeparator text="More tiers" noMargin={true} />
		<div class="tierBox">
			<div class="tierBoxLargeTier"><p>Tier 1</p></div>
			<ul class="tierBenefits">
				<li style="opacity: 50%;">Tier 2 benefits, but:</li>
				<li><CircleMinus size={20} style="margin-right: 10px; margin-bottom: -2px;" />Ad-supported</li>
				<li><CircleArrowDown size={20} style="margin-right: 10px; margin-bottom: -2px;" />10% XP boost</li>
				<li><CircleArrowDown size={20} style="margin-right: 10px; margin-bottom: -2px;" />Tier 1 Badge</li>
			</ul>
			<button
				id="tierPrice1"
				class="standardButton tierBuyButton white"
				onclick={() => startPurchase(1)}
				class:tierBuyButtonUnlocked={$supporterLevel >= 1}>{getTierPrice(1)}</button
			>
		</div>
		<div class="tierBox">
			<div class="tierBoxLargeTier"><p>Tier 3</p></div>
			<ul class="tierBenefits">
				<li style="opacity: 50%;">Tier 2 benefits, plus:</li>
				<li><CircleArrowUp size={20} style="margin-right: 10px; margin-bottom: -2px;" />25% XP boost</li>
				<li><CircleArrowUp size={20} style="margin-right: 10px; margin-bottom: -2px;" />Tier 3 Badge</li>
			</ul>
			<button
				id="tierPrice3"
				class="standardButton tierBuyButton white"
				onclick={() => startPurchase(3)}
				class:tierBuyButtonUnlocked={$supporterLevel >= 3}
				>{getTierPrice(3)}
				{#if $supporterLevel >= 1 && $supporterLevel < 3}
					<span class="discountBadge">Upgrade</span>
				{/if}</button
			>
		</div>
		<p id="supporterInfoText">
			The
			<a href="/legal" target="_blank">terms of use</a>
			apply.
		</p>
	</div>
</Popup>

<style>
	.tierBenefits {
		padding-left: 0px;
		font-size: 22px;
		margin-bottom: 10px;
		list-style-type: none;
	}

	.tierBenefitsLarge {
		border-radius: 10px;
		background-color: var(--box-color);
		padding: var(--layout-margin);
		box-shadow: var(--box-shadow);
		width: 245px;
	}

	.tierBenefitsScroll {
		max-height: 135px;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.discountBadge {
		font-size: 18px;
		padding: 2px;
		opacity: 0.9;
		padding-left: 5px;
		padding-right: 9px;
		font-style: italic;
		border-radius: 3px;
		margin-left: 2px;
		background-color: rgba(0, 0, 0, 0.1);
		vertical-align: 2px;
	}

	.tierBenefits li {
		margin-bottom: 10px;
	}

	.tierBuyButton {
		width: 100%;
		margin-top: auto;
		position: relative;
		overflow: hidden;
	}

	.tierBuyButtonDisplay::before {
		animation: supporterGlintButton 5s 2s infinite;
		background: white;
		filter: blur(15px);
		content: "";
		opacity: 0;
		position: absolute;
		width: 40px;
		z-index: 1;
		height: 200%;
		top: -20px;
		left: 0;
		transform: rotate(30deg);
		pointer-events: none;
	}

	.tierBuyButtonDisplay {
		max-width: 275px;
		margin-top: 0;
		background-color: var(--supporter-green);
	}

	:global(.baseTierPrice) {
		margin-right: 5px;
		color: rgba(255, 255, 255, 0.5);
		text-decoration: line-through;
	}

	:global(.tierBuyButtonUnlocked) {
		pointer-events: none;
		opacity: 0.5;
	}

	.tierBox {
		background-color: var(--box-color);
		border-radius: 10px;
		box-shadow: var(--box-shadow);
		display: flex;
		flex-direction: column;
		padding: 20px;
		overflow: hidden;
		flex-grow: 1;
		transition: filter 250ms ease;
		position: relative;
		height: 210px;
	}

	.tierBoxLarge {
		width: 100%;
		background-color: var(--box-color);
		border-radius: 10px;
		padding: 20px;
		box-shadow: var(--box-shadow);
		display: flex;
		justify-content: space-between;
		position: relative;
		margin-bottom: var(--box-margin);
	}

	.tierBoxLargeTier {
		position: absolute;
		right: 0;
		top: 0;
		width: 70px;
		height: 35px;
		text-align: center;
		line-height: 35px;
		border-bottom-left-radius: 10px;
		border-top-right-radius: 10px;
		box-shadow: var(--bulb-shadow);
		background-color: var(--box-color);
	}

	.tierBoxLargeHeader {
		padding-bottom: 5px;
		margin-bottom: auto;
	}

	.supporterPerksImage {
		width: 300px;
		height: fit-content;
		margin-top: 20px;
		margin-right: 25px;
	}

	.tierBoxDisplay {
		flex-grow: 1;
		display: flex;
		gap: var(--layout-margin);
		flex-direction: column;
	}

	.supporterBoxFlex {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--layout-margin);
		padding-top: 5px;
	}

	#supporterInfoText {
		opacity: 0.25;
		text-align: center;
		margin-inline: auto;
		width: 100%;
	}

	@keyframes supporterGlintButton {
		0% {
			opacity: 0.7;
			margin-left: -50px;
			visibility: visible;
		}

		20% {
			opacity: 0.5;
			margin-left: calc(100% + 50px);
		}

		100% {
			opacity: 0.5;
			margin-left: calc(100% + 50px);
		}
	}

	@media (max-width: 800px) {
		.tierBoxLarge {
			flex-wrap: wrap;
		}

		.tierBuyButtonDisplay {
			max-width: unset;
		}

		.tierBenefitsLarge {
			width: unset;
		}

		.supporterPerksImage {
			display: none;
		}

		.tierBoxLargeHeader {
			max-width: 80%;
		}
	}
</style>
