<script>
	import { discordPopup } from "$lib/stores/uiStore";
	import { addUserXP } from "$lib/utils/updateUserXP";
	import Popup from "./ui/Popup.svelte";
	import { experience } from "$lib/stores/accountStore";
	import { playSound } from "$lib/utils/soundManager";
	import { get } from "svelte/store";
	import { discordInviteUrl } from "$lib/stores/context-specific/apiConfigStore";

	function clickJoin() {
		playSound("basic_button");
		window.open($discordInviteUrl, "_blank").focus();

		setTimeout(async function () {
			closePopup();
			await addUserXP(7500);
		}, 250);
	}

	function closePopup() {
		discordPopup.set(false);
		localStorage.setItem("discordPopup", "true");
	}
</script>

<Popup verySlim={true} bind:open={$discordPopup} onclose={closePopup}>
	<div class="popup-title">
		<h1 id="socialHeader">Join the community</h1>
	</div>
	<p>
		Join now and get <span class="experienceHighlight">7,500 XP</span>
		in return!
	</p>
	<iframe
		id="discordWidget"
		title="Discord Widget"
		width="350"
		height="500"
		allowtransparency="true"
		frameborder="0"
		src="https://discord.com/widget?id=1221841177863651499&theme=dark"
		sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
	></iframe>
	<button id="socialPopupJoin" class="standardButton largeButton white" onclick={clickJoin}>
		Join
		<img src="/img/discord.png" class="socialIcon discordIconJoin" alt="Discord Icon" />
	</button>
</Popup>

<style>
	#socialPopupJoin {
		background-color: #8e44f0;
	}

	.experienceHighlight {
		color: rgb(198, 255, 198);
		text-shadow: 0 0 10px #00cc00;
	}

	.discordIconJoin {
		vertical-align: -1px;
	}

	#discordWidget {
		margin-top: 30px;
		height: 100%;
		width: 100%;
		min-height: 300px;
	}
</style>
