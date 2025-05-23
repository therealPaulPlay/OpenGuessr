<script>
	let { pinId, pinLockText = "default", unlocked = false } = $props();
	import { selectedPinIndex } from "$lib/stores/accountStore";
	import { profileData } from "$lib/stores/context-specific/profileStore";
	import { setSelectedProfilePin } from "$lib/utils/updateProfileData";
	import { playSound } from "$lib/utils/soundManager";
</script>

<button
	class="pinHolder"
	class:selectedPin={$selectedPinIndex == pinId}
	onclick={() => {
		if (unlocked) {
			playSound("item_select");
			setSelectedProfilePin(pinId);
		} else {
			playSound("item_locked");
		}
	}}
>
	<div id="pinLock0" class="pinLock" style:display={unlocked ? "none" : ""}>
		<p class="pinLockText">{pinLockText}</p>
	</div>
	<img class="pinSelectIcon" src={"/img/your_marker" + pinId + ".png"} alt="pin icon" />
</button>

<style>
	.pinHolder {
		position: relative;
		box-sizing: border-box;
		height: 80px;
		width: 80px;
		min-height: 80px;
		min-width: 80px;
		flex-grow: 1;
		border-radius: 5px;
		background-color: rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		justify-content: center;
		transition:
			scale 250ms ease,
			filter 250ms ease;
	}

	.pinHolder:hover {
		scale: 0.97;
		filter: brightness(1.3);
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
	}

	.pinLockText {
		font-size: 20px;
		margin: 2px;
		color: white;
		line-height: 0.9;
		padding-inline: 2px;
		text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
	}

	.pinSelectIcon {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		height: 40px;
		width: auto;
		z-index: 1;
	}

	.selectedPin {
		border: solid 3px white;
	}
</style>
