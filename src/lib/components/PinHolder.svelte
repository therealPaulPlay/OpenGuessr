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
	import { setSelectedProfilePin } from "$lib/utils/updateProfileData";
	import { playSound } from "$lib/utils/soundManager";
	import { slide } from "svelte/transition";
	import { Check } from "@lucide/svelte";
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
<div
	class="pin-holder"
	role="button"
	tabindex={0}
	bind:this={pinHolderElement}
	style:scale={shop ? "1" : ""}
	class:bigger-size={shop}
	class:selected-pin={$selectedPinIndex == pinId && !shop}
	class:disabled
	style:border-radius={shop ? "var(--box-margin)" : ""}
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
		<div id="pin-lock-0" class="pin-lock">
			<p class="pin-lock-text">{pinLockText}</p>
		</div>
	{/if}
	{#if rarity && !isHovered}
		<div
			transition:slide={{ duration: 250 }}
			class="rarity-display"
			class:common-color={rarity == "common"}
			class:rare-color={rarity == "rare"}
			class:epic-color={rarity == "epic"}
			class:legendary-color={rarity == "legendary"}
		>
			<p>{rarity}</p>
		</div>
	{/if}
	<div class="pin-flex">
		<img
			class="pin-select-icon"
			class:small-select-icon={shop && isHovered}
			src={"/img/pins/player_pin" + pinId + ".png"}
			alt="pin icon"
		/>
		{#if shop && isHovered}
			<div class="shop-button-box" transition:slide={{ axis: "y", duration: 250 }}>
				<button
					class="standard-button white center-button"
					disabled={unlocked}
					onclick={() => {
						playSound("basic_button");
						handleShopPurchase("pin", price, pinId);
					}}
				>
					{#if !unlocked}
						<img class="token-icon" alt="token" src="/img/token_icon_white.png" />
						{price}
					{:else}
						Owned <Check
							size={18}
							strokeWidth={3.25}
							style="min-width: 18px; margin-bottom: -3px; margin-left: var(--content-margin);"
						/>
					{/if}
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.pin-holder {
		position: relative;
		box-sizing: border-box;
		overflow: hidden;
		min-height: 80px;
		min-width: 80px;
		border-radius: var(--content-margin);
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

	.pin-holder:hover {
		scale: 0.97;
	}

	.bigger-size {
		min-width: 120px;
		min-height: 100px;
	}

	.rarity-display {
		position: absolute;
		border-top-right-radius: var(--box-margin);
		border-bottom-left-radius: var(--box-margin);
		top: 0;
		right: 0;
		padding-inline: var(--panel-margin);
		user-select: none;
		box-shadow: var(--bulb-shadow);
	}

	.token-icon {
		width: 25px;
		height: 25px;
		margin-right: 3px;
		margin-top: 1px;
		margin-left: -2px;
		user-select: none;
		pointer-events: none;
	}

	.common-color {
		background-color: var(--common-color);
	}

	.rare-color {
		background-color: var(--rare-color);
	}

	.epic-color {
		background-color: var(--epic-color);
	}

	.legendary-color {
		background-color: var(--legendary-color);
	}

	.rarity-display p {
		font-size: 18px;
		font-style: italic;
		margin-top: -3px;
	}

	.shop-button-box {
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

	.center-button {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}

	.pin-flex {
		display: flex;
		flex-wrap: wrap;
		flex-direction: column;
		align-items: center;
	}

	.pin-lock {
		border-radius: var(--content-margin);
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

	.pin-lock-text {
		font-size: 20px;
		margin: 2px;
		color: white;
		line-height: 0.9;
		padding-inline: 2px;
		user-select: none;
		text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
	}

	.pin-select-icon {
		height: 40px;
		width: 40px;
		z-index: 1;
		user-select: none;
		pointer-events: none;
		transition:
			width 250ms ease,
			height 250ms ease,
			margin 250ms ease;
	}

	.small-select-icon {
		height: 30px;
		width: 30px;
		margin-bottom: 45px;
	}

	.selected-pin {
		filter: brightness(1.2);
		background-color: rgba(255, 255, 255, 0.25);
	}
</style>
