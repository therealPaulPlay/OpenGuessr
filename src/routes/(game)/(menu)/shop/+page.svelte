<script>
	import PinHolder from "$lib/components/PinHolder.svelte";
	import { purchasedPins, tokens } from "$lib/stores/accountStore";
	import { Clock } from "lucide-svelte";
	import { scale } from "svelte/transition";

	const pinRarities = {
		common: {
			name: "common",
			pinIndexes: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109],
			price: 250,
		},
		rare: {
			name: "rare",
			pinIndexes: [200, 201, 202, 203, 204, 205, 206],
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

	const tokenOffers = {
		free: {
			imageSrc: "/img/token_stack_free.png",
			price: "Free",
			symbol: "",
			amount: 15,
		},
		small: {
			imageSrc: "/img/token_stack_small.png",
			price: "2.99",
			symbol: "$",
			amount: 550,
		},
		medium: {
			imageSrc: "/img/token_stack_medium.png",
			price: "5.99",
			symbol: "$",
			amount: 1350,
		},
		large: {
			imageSrc: "/img/token_stack_large.png",
			price: "9.99",
			symbol: "$",
			amount: 2850,
		},
	};

	let specialOfferPins = $state([201, 202, 203, 204]);
	let specialOfferPrice = $state(500);
	let specialOfferRarity = $state("rare");

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
	<div class="splitContainer">
		<div class="leftSide" in:scale={{ start: 0.9, duration: 250 }}>
			{#if specialOfferPins}
				<div
					class="specialOffer"
					class:commonGradient={specialOfferRarity == "common"}
					class:rareGradient={specialOfferRarity == "rare"}
					class:epicGradient={specialOfferRarity == "epic"}
					class:legendaryGradient={specialOfferRarity == "legendary"}
				>
					<div
						class="specialOfferRarityDisplay"
						class:commonColor={specialOfferRarity == "common"}
						class:rareColor={specialOfferRarity == "rare"}
						class:epicColor={specialOfferRarity == "epic"}
						class:legendaryColor={specialOfferRarity == "legendary"}
					>
						<p>{specialOfferRarity}</p>
					</div>
					<h1 class="specialOfferTitle">
						{specialOfferRarity?.[0]?.toUpperCase() + specialOfferRarity.slice(1) || "Default"} bundle!
					</h1>
					<div class="specialOfferItems">
						{#each specialOfferPins as pinIndex}
							<PinHolder pinId={pinIndex} shop={true} />
						{/each}
					</div>
					<button class="standardButton white specialOfferButton" class:disabled={specialOfferPrice == 0}>
						<img class="tokenIconWhite" alt="token" src="/img/token_icon_white.png" />
						<span class="specialOfferCrossedOut">{calculateRegularBundlePrice(specialOfferPins)}</span>
						{specialOfferPrice != 0 ? specialOfferPrice : "Owned"}
					</button>
				</div>
			{:else}
				<p class="loadingText">Loading...</p>
			{/if}
		</div>
		<div class="rightSide" in:scale={{ start: 0.9, delay: 100, duration: 250 }}>
			<div class="tokenDisplay">
				<div class="shopInfoSection">
					<Clock style="color: white; margin-right: 3px; min-width: fit-content;" strokeWidth={2.25} size={22} />
					<p>Restock in {timeUntilUTCMidnight()}</p>
				</div>
				<div class="shopInfoSection">
					<p>{$tokens} Tokens</p>
					<img class="tokenIcon" alt="token" src="/img/token_icon.png" />
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
						<button class="standardButton shopOfferButton white"> {offer.symbol + offer.price} </button>
					</div>
				{/each}
			</div>
		</div>
	</div>
	<div class="headerContainer">
		<h1 class="header">All pins</h1>
	</div>
	<div class="allPinsContainer">
		{#each Object.values(pinRarities) as rarity}
			{#each rarity?.pinIndexes as index}
				<PinHolder
					pinId={index}
					shop={true}
					rarity={rarity.name}
					price={rarity.price}
					unlocked={$purchasedPins.includes(index)}
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

	.leftSide {
		border-radius: var(--layout-margin);
		flex-grow: 1;
		height: 100%;
		max-width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--box-color);
		padding: var(--box-margin);
		box-sizing: border-box;
		height: 500px;
	}

	.loadingText {
		opacity: 0.5;
	}

	.tokenIconWhite {
		width: 25px;
		height: 25px;
	}

	.rightSide {
		border-radius: var(--layout-margin);
		flex-grow: 1;
		height: 100%;
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
		max-width: 60%;
		text-wrap: nowrap;
		overflow: hidden;
	}

	.shopInfoSection p {
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.tokenIcon {
		width: 32px;
		height: 32px;
		margin-top: 1px;
	}

	.tokenShop {
		width: 100%;
		flex-grow: 1;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		box-sizing: border-box;
		padding: var(--box-margin);
		border-radius: var(--layout-margin);
		gap: var(--box-margin);
		box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.2);
		overflow: hidden;
	}

	.shopOffer {
		border-radius: var(--box-margin);
		background-color: var(--box-color);
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
		mask-image: linear-gradient(to bottom, rgb(255, 255, 255) 50%, rgba(255, 255, 255, 0.5) 100%);
	}

	.shopOfferInfo h2 {
		text-wrap: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.shopOfferButton {
		width: 100%;
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
		padding: var(--box-margin);
		display: flex;
		align-items: center;
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		gap: var(--box-margin);
		flex-wrap: wrap;
		box-sizing: border-box;
	}

	.specialOfferButton {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 3px;
		min-height: 50px;
		border-radius: var(--box-margin);
		padding-inline: 20px;
	}

	.disabled {
		pointer-events: none;
		opacity: 0;
	}

	.specialOfferCrossedOut {
		text-decoration: line-through;
		opacity: 0.5;
		text-decoration-thickness: 2px;
		margin-right: 3px;
	}

	.specialOffer {
		width: 100%;
		height: 100%;
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
		overflow: auto;
	}

	:global(.specialOfferItems .pinHolder) {
		border-radius: var(--box-margin);
		pointer-events: none;
	}

	.specialOfferRarityDisplay {
		position: absolute;
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
