<script>
	let {
		pinId,
		pinLockText = "Default",
		unlocked = false,
		shop = false,
		price = 100,
		rarity,
		disabled = false,
	} = $props();
	import { selectedPinIndex } from "$lib/stores/accountStore";
	import { profileData } from "$lib/stores/context-specific/profileStore";
	import { setSelectedProfilePin } from "$lib/utils/updateProfileData";
	import { playSound } from "$lib/utils/soundManager";
	import { blur, slide } from "svelte/transition";
	import { showNotification } from "$lib/utils/notifications";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import { Check } from "lucide-svelte";
	import { handleShopPurchase } from "$lib/utils/shopHelper";

	let isHovered = $state(false);
	let pinHolderElement = $state();
</script>

<svelte:document
	onpointerdown={(e) => {
		if (!pinHolderElement.contains(e.target)) isHovered = false;
	}}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="pinHolder"
	role="button"
	tabindex={0}
	bind:this={pinHolderElement}
	style:scale={shop ? "1" : ""}
	class:biggerSize={shop}
	class:selectedPin={$selectedPinIndex == pinId && !shop}
	class:disabled
	onpointerenter={(e) => {
		if (e.pointerType !== "touch") isHovered = true;
	}}
	onpointerleave={(e) => {
		if (e.pointerType !== "touch") isHovered = false;
	}}
	onclick={() => {
		if (shop) return (isHovered = true);
		if (unlocked) {
			playSound("item_select");
			setSelectedProfilePin(pinId);
		} else {
			playSound("item_locked");
		}
	}}
>
	{#if !unlocked && !shop}
		<div id="pinLock0" class="pinLock">
			<p class="pinLockText">{pinLockText}</p>
		</div>
	{/if}
	{#if rarity && !isHovered}
		<div
			transition:slide={{ duration: 250 }}
			class="rarityDisplay"
			class:commonColor={rarity == "common"}
			class:rareColor={rarity == "rare"}
			class:epicColor={rarity == "epic"}
			class:legendaryColor={rarity == "legendary"}
		>
			<p>{rarity}</p>
		</div>
	{/if}
	<div class="pinFlex">
		<img
			class="pinSelectIcon"
			class:smallSelectIcon={shop && isHovered}
			src={"/img/pins/player_pin" + pinId + ".png"}
			alt="pin icon"
		/>
		{#if shop && isHovered}
			<div class="shopButtonBox" transition:slide={{ axis: "y", duration: 250 }}>
				<button
					class="standardButton white centerButton"
					class:disabled={unlocked}
					onclick={() => {
						playSound("basic_button");
						handleShopPurchase("pin", price, pinId);
					}}
				>
					{#if !unlocked}
						<img class="tokenIcon" alt="token" src="/img/token_icon_white.png" />
						{price}
					{:else}
						Owned <Check size={18} strokeWidth={3.25} style="min-width: 18px; margin-bottom: -3px; margin-left: 5px;" />
					{/if}
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.pinHolder {
		position: relative;
		box-sizing: border-box;
		min-height: 80px;
		min-width: 80px;
		border-radius: 5px;
		background-color: rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		justify-content: center;
		box-shadow: var(--button-shadow);
		cursor: pointer;
		flex-grow: 1;
		transition:
			scale 250ms ease,
			opacity 250ms ease,
			background-color 250ms ease,
			filter 250ms ease;
	}

	.pinHolder:hover {
		scale: 0.97;
	}

	.biggerSize {
		min-width: 120px;
		min-height: 100px;
	}

	.rarityDisplay {
		position: absolute;
		border-top-right-radius: 5px;
		border-bottom-left-radius: 5px;
		top: 0;
		right: 0;
		padding-inline: var(--panel-margin);
		user-select: none;
		box-shadow: var(--bulb-shadow);
	}

	.tokenIcon {
		width: 25px;
		height: 25px;
		margin-right: 3px;
		margin-top: 1px;
		margin-left: -2px;
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

	.rarityDisplay p {
		font-size: 18px;
		font-style: italic;
		margin-top: -3px;
	}

	.shopButtonBox {
		position: absolute;
		bottom: 0;
		width: 100%;
		z-index: 2;
		box-sizing: border-box;
		padding: var(--box-margin);
	}

	.disabled {
		pointer-events: none;
		opacity: 0.5;
	}

	.centerButton {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}

	.pinFlex {
		display: flex;
		flex-wrap: wrap;
		flex-direction: column;
		align-items: center;
	}

	.pinLock {
		border-radius: 5px;
		background-color: rgba(4, 8, 15, 0.25);
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 2;
		position: absolute;
		text-align: center;
	}

	.pinLockText {
		font-size: 20px;
		margin: 2px;
		color: white;
		line-height: 0.9;
		padding-inline: 2px;
		user-select: none;
		text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
	}

	.pinSelectIcon {
		height: 40px;
		width: 40px;
		z-index: 1;
		user-select: none;
		transition:
			width 250ms ease,
			height 250ms ease,
			margin 250ms ease;
	}

	.smallSelectIcon {
		height: 30px;
		width: 30px;
		margin-bottom: 45px;
	}

	.selectedPin {
		filter: brightness(1.2);
		background-color: rgba(255, 255, 255, 0.25);
	}
</style>
