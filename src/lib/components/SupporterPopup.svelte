<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { loadAndInitializeLibrary } from "$lib/utils/scriptLoader";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { initializeRewardedAd } from "$lib/utils/rewardedAds";
	import { supporterLevel, supportedAmount, freeSupporterBoostEnabled } from "$lib/stores/accountStore";
	import { supporterPopupVisible } from "$lib/stores/context-specific/supporterPopupStore";
	import { onMount } from "svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { Clock9 } from "lucide-svelte";

	const basePrices = [2.99, 6.99, 14.99, 24.99];

	function closeSupporterWindow() {
		supporterPopupVisible.set(false);
	}

	function getTierPrice(tier) {
		if ($supporterLevel >= tier) return "Unlocked";
		if ($supporterLevel == 0) return "$ " + basePrices[tier - 1];
		return "$ " + Math.round(Math.max(basePrices[tier - 1] - $supportedAmount - 0.01, 0) * 100) / 100;
	}

	// Initialize Stripe
	const stripeLivePubKey =
		"pk_live_51Ple5q1DTHjmMID9LrSuKNuwlN0Ls0issp2PTRO9QWGPdmKpLspMUXvKZQnXtHT5u0SxYZDBVSDsadzy3lAq5T2j00X9uGEJdr";

	let stripe;

	// Load stripe
	async function getStripe() {
		stripe = await loadAndInitializeLibrary("https://js.stripe.com/v3/", "Stripe", (Stripe) =>
			Stripe(stripeLivePubKey),
		);

		return stripe;
	}

	// Function to handle buy button click
	async function handleBuyClick(productId) {
		if (!stripe) {
			await getStripe();
		}

		try {
			// Fetch the current user's ID (you need to implement this based on your authentication system)
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

			if (result.error) {
				console.error("Error occured during request to stripe:", result.error.message);
				errorPopup(
					"Stripe request failed",
					"The server returned an error from your purchase request.",
					error,
					false,
					false,
				);
			}
		} catch (error) {
			console.error("Error occured when trying to send request to stripe:", error);
			errorPopup("Error sending stripe request", "Your purchase request couldn't be sent.", error, false, false);
		}
	}

	function startPurchase(productId) {
		handleBuyClick(productId);
		playSound("basic_button");
	}

	// Thank you window after purchase for stripe
	onMount(() => {
		let urlParams = new URLSearchParams(window.location.search);

		let stripeSessionFinished;

		try {
			stripeSessionFinished = urlParams.get("payment_completed");
			if (stripeSessionFinished) {
				showConfirmPopup(
					"Thank you!",
					"You are now a supporter - thank you for your contribution! Supporters like you keep the game free and open for everyone.",
					false,
					false,
					false,
					true,
				);
				history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
			}
		} catch {}
	});

	// Free ad-supported experience boost --------------------------------------------------------------------------

	let freeSupporterBoostButton = $state();

	function supporterBoostAdDismiss(adNotAvailable, rewardClaimed) {
		if (adNotAvailable) {
			errorPopup("No ad available", "Please try again later or disable Ad Blockers.", "No ads", false, false);
		} else {
			if (!rewardClaimed) {
				errorPopup("Ad dismissed", "Video ad dismissed. ", "", false, true);
			}
		}
	}

	function enableSupporterAdBoost() {
		startAdSupporterTimer();
		$freeSupporterBoostEnabled = true;
	}

	let freeSupporterBoostText = $state();
	let boostTimerRunning = $state(false);

	$effect(() => {
		if (!boostTimerRunning) {
			freeSupporterBoostText = $freeSupporterBoostEnabled
				? "Experience boost activated."
				: "Free 20% experience boost.";
		}
	});

	async function startAdSupporterTimer(prefix = "Boost active. Remaining: ") {
		boostTimerRunning = true;
		let t = 180;

		function timer() {
			let timeText = t > 59 ? Math.floor(t / 60) + ":" + (t % 60).toString().padStart(2, "0") + " min" : t + "s";
			freeSupporterBoostText = prefix + timeText;

			if (t > 0) {
				setTimeout(timer, 1000);
				t--;
			} else {
				$freeSupporterBoostEnabled = false;
				boostTimerRunning = false;
				showConfirmPopup(
					"Boost expired",
					"Your free experience boost has expired. Do you want to reactivate it?",
					() => {
						initializeRewardedAd(supporterBoostAdDismiss, enableSupporterAdBoost);
					},
					false,
					false,
					false,
					"Reactivate",
					"#588e6b",
				);
			}
		}

		timer();
	}
</script>

{#if $supporterPopupVisible}
	<Popup z={971} slim={true}>
		<div class="popup-title">
			<h1 class="shiftTitle">
				Supporter tiers
				<img id="supporterIconTitle" alt="supporter tag" src="/img/supporter_icon.png" />
			</h1>
		</div>
		<div id="supporterTierScrollBox" class="supporterBox supporterBoxFlex">
			<div id="adTierBox" class="adTierBox supporterArea" class:adTierBoxDisabled={$freeSupporterBoostEnabled}>
				<Clock9 strokeWidth={2.25} size={24} color="white" style="opacity: 50%; margin-left: 5px; margin-right: 3px;" />
				<p id="freeSupporterBoostText" bind:textContent={freeSupporterBoostText} contenteditable="false"></p>
				<button
					id="freeSupporterBoost"
					class="standardButton white"
					class:freeSupporterBoostDisabled={$freeSupporterBoostEnabled}
					bind:this={freeSupporterBoostButton}
					onclick={() => {
						playSound("basic_button");
						initializeRewardedAd(supporterBoostAdDismiss, enableSupporterAdBoost);
					}}>Watch ad to activate</button
				>
			</div>
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
						<span class="discountBadge">Upgrade Discount</span>
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
						<span class="discountBadge">Upgrade Discount</span>
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
						<span class="discountBadge">Upgrade Discount</span>
					{/if}</button
				>
			</div>
			<p id="supporterInfoText">
				All purchases are one-time payments.
				<a href="/legal" target="_blank">Terms and conditions</a>
				apply.
			</p>
		</div>
		<button
			id="supporterClose"
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				closeSupporterWindow();
			}}>Close</button
		>
	</Popup>
{/if}

<style>
	#freeSupporterBoost {
		flex-grow: 1;
		margin-right: 2px;
	}

	.freeSupporterBoostDisabled {
		opacity: 0.5;
		pointer-events: none;
	}

	#freeSupporterBoostText {
		flex-grow: 10;
		max-width: 75%;
		font-size: 22px;
	}

	.tierNumber {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 3px;
		padding: 2px !important;
		padding-inline: 8px !important;
	}

	#adTierBox {
		border-radius: 10px;
		margin: 0;
		background: var(--box-color);
		transition:
			background-color 250ms ease,
			filter 250ms ease;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--box-margin);
		flex-wrap: wrap;
	}

	.adTierBoxDisabled {
		pointer-events: none;
		background: rgba(255, 255, 255, 0.1);
	}

	#supporterIconTitle {
		width: 40px;
		height: 40px;
		margin-left: 7px;
		vertical-align: -5px;
	}

	.tierBoxTier {
		background-color: var(--box-color);
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
		margin-left: 5px;
		background-color: rgba(0, 0, 0, 0.15);
		vertical-align: 1px;
	}

	.tierBenefits li {
		margin-bottom: 15px;
	}

	.tierBuyButton {
		flex-grow: 1;
		background: var(--supporter-gradient);
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

	.tierBox:hover .tierBuyButton {
		filter: brightness(1.2);
	}

	.tierBox::before {
		animation: supporterGlintTierBox 5s 2s infinite;
		background: linear-gradient(90deg, #00ff1c00 1%, #cfffd754 50%, #c0ffcd00);
		border-radius: inherit;
		content: "";
		height: 4px;
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
		margin-top: 10px;
		max-height: calc(100dvh - 300px);
		overflow-x: hidden;
		overflow-y: auto;
		border-radius: 5px;
		border-radius: 5px;
	}

	.supporterBox {
		padding: 10px;
		width: calc(100% - 20px);
		border-radius: 10px;
	}

	.supporterBox p {
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
