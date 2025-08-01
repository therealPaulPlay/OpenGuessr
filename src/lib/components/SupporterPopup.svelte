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
	import { Clock9 } from "lucide-svelte";
	import { getStripe } from "$lib/utils/getStripe";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";

	const basePrices = [2.99, 6.99, 14.99, 24.99];

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
		<h1 class="shiftTitle">
			Supporter tiers
			<img id="supporterIconTitle" alt="supporter tag" src="/img/supporter_icon.png" />
		</h1>
	</div>
	<div class="supporterBoxFlex">
		<div class="tierBox">
			<div class="tierBoxTier"><p class="tierNumber">Tier 1</p></div>
			<ul class="tierBenefits">
				<li>Highlighted on leaderboards</li>
				<li>Supporter profile icon</li>
				<li>Special Supporter pin</li>
				<li>Tier 1 Supporter badge</li>
				<li>10% Supporter XP boost</li>
			</ul>
			<button
				id="tierPrice1"
				class="standardButton tierBuyButton"
				onclick={() => startPurchase(1)}
				class:tierBuyButtonUnlocked={$supporterLevel >= 1}>{getTierPrice(1)}</button
			>
		</div>
		<div class="tierBox">
			<div class="tierBoxTier"><p class="tierNumber">Tier 2</p></div>
			<ul class="tierBenefits">
				<li>All previous benefits</li>
				<li>Ad-free experience</li>
				<li>Tier 2 Supporter badge</li>
				<li>15% Supporter XP boost</li>
			</ul>
			<button
				id="tierPrice2"
				class="standardButton tierBuyButton"
				onclick={() => startPurchase(2)}
				class:tierBuyButtonUnlocked={$supporterLevel >= 2}
				>{getTierPrice(2)}
				{#if $supporterLevel >= 1 && $supporterLevel < 2}
					<span class="discountBadge">Upgrade</span>
				{/if}
			</button>
		</div>
		<div class="tierBox">
			<div class="tierBoxTier"><p class="tierNumber">Tier 3</p></div>
			<ul class="tierBenefits">
				<li>All previous benefits</li>
				<li>Tier 3 Supporter badge</li>
				<li>20% Supporter XP boost</li>
			</ul>
			<button
				id="tierPrice3"
				class="standardButton tierBuyButton"
				onclick={() => startPurchase(3)}
				class:tierBuyButtonUnlocked={$supporterLevel >= 3}
				>{getTierPrice(3)}
				{#if $supporterLevel >= 1 && $supporterLevel < 3}
					<span class="discountBadge">Upgrade</span>
				{/if}</button
			>
		</div>
		<div class="tierBox">
			<div class="tierBoxTier"><p class="tierNumber">Tier 4</p></div>
			<ul class="tierBenefits">
				<li>All previous benefits</li>
				<li>Tier 4 Supporter badge</li>
				<li>25% Supporter XP boost</li>
			</ul>
			<button
				id="tierPrice4"
				class="standardButton tierBuyButton"
				onclick={() => startPurchase(4)}
				class:tierBuyButtonUnlocked={$supporterLevel >= 4}
				>{getTierPrice(4)}
				{#if $supporterLevel >= 1 && $supporterLevel < 4}
					<span class="discountBadge">Upgrade</span>
				{/if}</button
			>
		</div>
		<p id="supporterInfoText">
			All purchases are one-time payments.
			<a href="/legal" target="_blank">Terms and conditions</a>
			apply.
		</p>
	</div>
</Popup>

<style>
	.tierNumber {
		background-color: rgba(0, 0, 0, 0.1);
		box-shadow: var(--bulb-shadow);
		border-radius: 5px;
		padding: 2px !important;
		padding-inline: 8px !important;
	}

	#supporterIconTitle {
		width: 40px;
		height: 40px;
		margin-left: 7px;
		vertical-align: -5px;
	}

	.tierBoxTier {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 125%;
		padding-top: 10px;
		padding-bottom: 10px;
		margin-bottom: 20px;
		margin-top: -10px;
	}

	.tierBenefits {
		padding-left: 30px;
		font-size: 22px;
		width: 90%;
		margin-bottom: 10px;
		min-height: 210px;
		width: 220px;
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
		margin-bottom: 15px;
	}

	.tierBuyButton {
		flex-grow: 1;
		background-color: var(--supporter-green);
		border-color: rgba(255, 255, 255, 0.3);
		width: 100%;
		margin-bottom: 15px;
	}

	.shiftTitle {
		margin-left: 10px;
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
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		box-shadow: var(--box-shadow);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		padding: var(--box-margin);
		padding-inline: 25px;
		overflow: hidden;
		flex-grow: 1;
		transition: filter 250ms ease;
		position: relative;
	}

	.tierBuyButton:hover {
		filter: brightness(1.2);
	}

	.tierBox::before {
		animation: supporterGlintTierBox 5s 2s infinite;
		background: linear-gradient(90deg, #00ff1c00 1%, #cfffd754 50%, #c0ffcd00);
		border-radius: inherit;
		content: "";
		height: 2px;
		inset: 0;
		opacity: 0;
		position: absolute;
		transform: translate(0);
		width: 50%;
		z-index: 1;
	}

	.supporterBoxFlex {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--layout-margin);
		padding-top: 5px;
	}

	.supporterBoxFlex p {
		padding: 7px;
	}

	#supporterInfoText {
		opacity: 0.5;
		font-size: 22px;
		text-align: center;
		margin-inline: auto;
	}

	@keyframes supporterGlintTierBox {
		10% {
			opacity: 1;
		}

		20% {
			opacity: 0;
			transform: translate(100%);
		}

		21% {
			opacity: 0;
			transform: translate(100%, 353px);
		}

		30% {
			opacity: 1;
		}

		40% {
			opacity: 0;
			transform: translateY(353px);
		}

		41% {
			opacity: 0;
			transform: translate(0);
		}

		50% {
			opacity: 1;
		}

		60% {
			opacity: 0;
			transform: translate(100%);
		}
	}
</style>
