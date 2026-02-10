<script>
	import PinHolder from "$lib/components/PinHolder.svelte";
	import { accountDataLoaded, isAuthenticated, purchasedPins, tokens } from "$lib/stores/accountStore";
	import {
		freeDailyTokensClaimed,
		shopPurchaseAnimation,
		specialOfferLoadingText,
		specialOfferPins,
		specialOfferPrice,
		specialOfferRarity,
	} from "$lib/stores/context-specific/shopStore";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { Clock } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { blur, scale, slide } from "svelte/transition";
	import {
		fetchSpecialOffer,
		handleShopFreeTokens,
		handleShopPurchase,
		handleShopYouTubePin,
		shopPurchaseTokenTier,
	} from "$lib/utils/shopHelper";
	import { playSound } from "$lib/utils/soundManager";
	import { tweened } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";

	// Tween the token value for a nicer look
	const animatedTokens = tweened(0, {
		duration: 500,
		easing: cubicOut,
	});

	tokens.subscribe((value) => {
		animatedTokens.set(value);
	});

	// Available pins
	const pinRarities = {
		common: {
			name: "common",
			pinIndexes: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109],
			price: 250,
		},
		rare: {
			name: "rare",
			pinIndexes: [200, 201, 202, 203, 204, 205, 206, 207],
			price: 500,
		},
		epic: {
			name: "epic",
			pinIndexes: [300, 301, 302, 303, 304, 305, 306, 307],
			price: 750,
		},
		legendary: {
			name: "legendary",
			pinIndexes: [400, 401, 402, 403, 404, 405],
			price: 1000,
		},
	};

	// Token offerings
	const tokenOffers = {
		free: {
			imageSrc: "/img/token_stack_free.png",
			price: 0,
			symbol: "",
			amount: 20,
		},
		small: {
			imageSrc: "/img/token_stack_small.png",
			price: 1.99,
			symbol: "$",
			amount: 900,
			tier: 1,
		},
		medium: {
			imageSrc: "/img/token_stack_medium.png",
			price: 2.99,
			symbol: "$",
			amount: 1650,
			savingsPercentage: 10,
			tier: 2,
		},
		large: {
			imageSrc: "/img/token_stack_large.png",
			price: 5.99,
			symbol: "$",
			amount: 3600,
			savingsPercentage: 33,
			tier: 3,
		},
	};

	onMount(fetchSpecialOffer);

	function calculateRegularBundlePrice(arrayOfPins = []) {
		let regPrice = 0;
		arrayOfPins.forEach((element) => {
			const firstDigit = parseInt(element?.toString()?.[0]);
			switch (firstDigit) {
				case 1:
					regPrice += pinRarities.common.price;
					break;
				case 2:
					regPrice += pinRarities.rare.price;
					break;
				case 3:
					regPrice += pinRarities.epic.price;
					break;
				case 4:
					regPrice += pinRarities.legendary.price;
					break;
			}
		});
		return regPrice;
	}

	function timeUntilUTCMidnight() {
		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
		tomorrow.setUTCHours(0, 0, 0, 0);
		const diff = tomorrow - now;
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		return `${hours}h, ${minutes}min`;
	}
</script>

<svelte:head>
	<title>Shop</title>
</svelte:head>

<div class="main-container">
	<div class="headerContainer">
		<h1 class="header">Shop</h1>
	</div>
	<!-- Split container with token offers and bundle -->
	<div class="splitContainer">
		<div class="leftSide" in:scale={{ start: 0.9, duration: 250 }}>
			{#if $specialOfferPins}
				<div
					class="specialOffer"
					transition:blur
					class:commonGradient={$specialOfferRarity == "common"}
					class:rareGradient={$specialOfferRarity == "rare"}
					class:epicGradient={$specialOfferRarity == "epic"}
					class:legendaryGradient={$specialOfferRarity == "legendary"}
				>
					<div
						class="specialOfferRarityDisplay"
						class:commonColor={$specialOfferRarity == "common"}
						class:rareColor={$specialOfferRarity == "rare"}
						class:epicColor={$specialOfferRarity == "epic"}
						class:legendaryColor={$specialOfferRarity == "legendary"}
					>
						<p>{$specialOfferRarity}</p>
					</div>
					<h1 class="specialOfferTitle">
						{$specialOfferRarity?.[0]?.toUpperCase() + $specialOfferRarity.slice(1) || "Default"} bundle!
					</h1>
					<div class="specialOfferItems">
						{#each $specialOfferPins as pinIndex}
							<PinHolder pinId={pinIndex} shop={true} disabled={$purchasedPins?.includes(pinIndex)} />
						{/each}
					</div>
					<button
						class="standardButton white specialOfferButton largeButton"
						disabled={$specialOfferPrice == 0}
						onclick={() => {
							playSound("basic_button");
							handleShopPurchase("bundle", $specialOfferPrice, undefined, $specialOfferPins);
						}}
					>
						<img class="tokenIconWhite" alt="token" src="/img/token_icon_white.png" />
						<span class="specialOfferCrossedOut">{calculateRegularBundlePrice($specialOfferPins)}</span>
						{$specialOfferPrice != 0 ? $specialOfferPrice : "Owned"}
					</button>
				</div>
			{:else}
				<p class="loadingText">{$specialOfferLoadingText}</p>
			{/if}
		</div>
		<div class="rightSide" in:scale={{ start: 0.9, delay: 100, duration: 250 }}>
			<div class="tokenDisplay">
				<div class="shopInfoSection">
					<Clock
						style="color: white; margin-right: 3px; min-width: fit-content; margin-bottom: -1px;"
						strokeWidth={2.25}
						size={22}
					/>
					<p>Restock in {timeUntilUTCMidnight()}</p>
				</div>
				<div class="shopInfoSection">
					<p>{Math.round($animatedTokens)?.toLocaleString()} Tokens</p>
					<img class="tokenIcon" alt="token" src="/img/token_icon_white.png" />
				</div>
			</div>
			<div class="tokenShop">
				{#each Object.values(tokenOffers) as offer}
					<div class="shopOffer">
						<div class="shopOfferInfo">
							<h2>{offer.amount?.toLocaleString()} Tokens</h2>
						</div>
						<div class="shopOfferGraphic">
							<img alt="token graphic" src={offer.imageSrc} class="tokenGraphic" />
						</div>
						<button
							class="standardButton shopOfferButton white"
							disabled={offer.price == 0 && $freeDailyTokensClaimed}
							onclick={() => {
								playSound("basic_button");
								if ($crazyGames) return errorPopup("Not supported", "Purchases on this platform are not supported.");
								if (!$isAuthenticated) return signupPrompt();
								if (offer.price == 0) handleShopFreeTokens();
								else shopPurchaseTokenTier(offer.tier);
							}}
						>
							{offer.symbol + (offer.price || ($freeDailyTokensClaimed ? "Claimed" : "Free"))}
							{#if offer.savingsPercentage}
								<span class="tokenSavings">-{offer.savingsPercentage}%</span>
							{/if}
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>
	<!-- All pins -->
	<div class="headerContainer">
		<h1 class="header">All pins</h1>
	</div>
	<!-- YouTube pitch-->
	{#if !$purchasedPins?.includes(500) && $accountDataLoaded}
		<div class="freeSocialPinContainer" transition:slide={{ axis: "y" }}>
			<p class="socialPinText">
				Not subscribed yet? <span class="socialPinSpan">Follow our YouTube channel to claim a free pin!</span>
			</p>
			<button
				class="standardButton white socialPinButton"
				onclick={() => {
					playSound("basic_button");
					window.open("https://www.youtube.com/@OpenGuessrOfficial?sub_confirmation=true", "_blank").focus();
					setTimeout(handleShopYouTubePin, 250);
				}}
			>
				<img alt="YouTube pin" src="/img/pins/player_pin500.png" class="socialPinIcon" />
				Subscribe
			</button>
		</div>
	{/if}
	<div class="allPinsContainer">
		{#each Object.values(pinRarities) as rarity}
			{#each rarity?.pinIndexes as index}
				<PinHolder
					pinId={index}
					shop={true}
					rarity={rarity.name}
					price={rarity.price}
					unlocked={$purchasedPins?.includes(index)}
				/>
			{/each}
		{/each}
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 75px;
	}

	.freeSocialPinContainer {
		width: 100%;
		box-sizing: border-box;
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		border-radius: var(--layout-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--box-margin);
		background-color: var(--box-color);
		margin-bottom: var(--layout-margin);
		flex-wrap: wrap;
	}

	.socialPinText {
		margin-left: var(--panel-margin);
		text-align: center;
		margin-right: auto;
	}

	.socialPinButton {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.socialPinSpan {
		opacity: 0.5;
		margin-left: var(--panel-margin);
	}

	.socialPinIcon {
		width: 50px;
		height: 50px;
		transform: rotate(-15deg);
		margin-left: -12px;
		margin-right: 5px;
		animation: socialPinAnimation 1.5s ease-in-out infinite alternate;
		transform-origin: bottom;
	}

	@keyframes socialPinAnimation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(-15deg);
		}
	}

	.leftSide {
		border-radius: var(--layout-margin);
		box-shadow: var(--box-shadow);
		flex-grow: 1;
		max-width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--box-color);
		padding: var(--box-margin);
		box-sizing: border-box;
		height: 500px;
		flex-basis: calc(50% - 150px);
	}

	.loadingText {
		opacity: 0.5;
		margin-inline: var(--box-margin);
		text-align: center;
	}

	.tokenIconWhite {
		width: 25px;
		height: 25px;
	}

	.rightSide {
		border-radius: var(--layout-margin);
		box-shadow: var(--box-shadow);
		flex-grow: 1;
		background-color: var(--box-color);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		align-items: center;
		width: 400px;
		height: 500px;
	}

	.tokenDisplay {
		width: 100%;
		height: 50px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 5px;
		padding-inline: var(--layout-margin);
		box-sizing: border-box;
	}

	.shopInfoSection {
		display: flex;
		align-items: center;
		gap: 5px;
		max-width: 50%;
		text-wrap: nowrap;
		overflow: hidden;
	}

	.shopInfoSection p {
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.tokenIcon {
		width: 25px;
		height: 25px;
		margin-top: 2px;
	}

	.tokenShop {
		width: 100%;
		box-shadow: var(--bulb-shadow);
		flex-grow: 1;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		box-sizing: border-box;
		padding: var(--box-margin);
		border-radius: var(--layout-margin);
		gap: var(--box-margin);
		overflow: hidden;
	}

	.shopOffer {
		border-radius: 5px;
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		box-sizing: border-box;
		gap: var(--box-margin);
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-grow: 1;
		overflow: hidden;
		flex-basis: 40%;
		position: relative;
		height: calc(50% - var(--box-margin) / 2);
	}

	.shopOffer:hover .tokenGraphic {
		scale: 1.05;
	}

	.shopOfferInfo {
		max-width: calc(100% - var(--box-margin) * 2);
		position: absolute;
		top: var(--layout-margin);
		mask-image: linear-gradient(to bottom, rgb(255, 255, 255) 50%, rgba(255, 255, 255, 0.6) 100%);
	}

	.shopOfferInfo h2 {
		text-wrap: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.shopOfferButton {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 5px;
	}

	.tokenGraphic {
		height: 135px;
		width: auto;
		transition: scale 250ms ease;
		margin-top: auto;
		filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.25));
	}

	.shopOfferGraphic {
		flex-grow: 1;
		display: flex;
	}

	.splitContainer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		width: 100%;
		margin-bottom: 50px;
		gap: var(--layout-margin);
	}

	.allPinsContainer {
		width: 100%;
		height: fit-content;
		box-shadow: var(--box-shadow);
		padding: var(--box-margin);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		gap: var(--box-margin);
		box-sizing: border-box;
	}

	.specialOfferButton {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 3px;
		padding-inline: 20px;
	}

	.specialOfferCrossedOut {
		text-decoration: line-through;
		opacity: 0.5;
		margin-right: 3px;
	}

	.tokenSavings {
		background-color: rgba(255, 255, 255, 0.15);
		color: white;
		padding-inline: 3px;
		font-size: 18px;
		border-radius: 3px;
	}

	.specialOffer {
		width: 100%;
		height: 100%;
		box-shadow: var(--box-shadow);
		border-radius: 5px;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		position: relative;
	}

	.specialOfferTitle {
		mask-image: linear-gradient(to bottom, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.6) 100%);
	}

	.specialOffer:hover .specialOfferItems {
		scale: 1.02;
	}

	.commonGradient {
		background: linear-gradient(0.6turn, rgba(208, 136, 136, 0.2), var(--box-color));
	}

	.rareGradient {
		background: linear-gradient(0.6turn, rgba(255, 68, 243, 0.2), var(--box-color));
	}

	.epicGradient {
		background: linear-gradient(0.6turn, rgba(75, 234, 255, 0.2), var(--box-color));
	}

	.legendaryGradient {
		background: linear-gradient(0.6turn, rgba(255, 214, 51, 0.2), var(--box-color));
	}

	.specialOfferItems {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		max-width: calc(100% - var(--layout-margin) * 2);
		max-height: 50%;
		width: 300px;
		margin-top: 30px;
		margin-bottom: 40px;
		transition: scale 250ms ease;
		padding-bottom: 5px;
		padding-top: 5px;
		overflow: auto;
	}

	:global(.specialOfferItems .pinHolder) {
		border-radius: var(--box-margin);
		pointer-events: none;
	}

	.specialOfferRarityDisplay {
		position: absolute;
		box-shadow: var(--bulb-shadow);
		border-top-right-radius: 5px;
		border-bottom-left-radius: 5px;
		top: 0;
		right: 0;
		padding-inline: var(--panel-margin);
		user-select: none;
	}

	.specialOfferRarityDisplay p {
		font-style: italic;
		margin-top: -3px;
	}

	.commonColor {
		background-color: var(--common-color);
	}

	.rareColor {
		background-color: var(--rare-color);
	}

	.epicColor {
		background-color: var(--epic-color);
	}

	.legendaryColor {
		background-color: var(--legendary-color);
	}
</style>
