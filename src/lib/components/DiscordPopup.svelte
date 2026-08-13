<script>
	import { discordPopup } from "$lib/stores/uiStore";
	import { addUserXP } from "$lib/utils/updateUserXP";
	import Popup from "./ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { discordInviteUrl } from "$lib/stores/context-specific/apiConfigStore";

	function closePopup() {
		discordPopup.set(false);
		localStorage.setItem("discordPopup", "true");
	}
</script>

<Popup verySlim={true} bind:open={$discordPopup} onUserClose={closePopup}>
	<div class="popup-title">
		<h1>Join our Discord</h1>
	</div>
	<p>
		Join the OpenGuessr community on Discord and receive <span class="experience-highlight">7,500 XP</span>.
	</p>
	<iframe
		id="discord-widget"
		title="Discord Widget"
		width="350"
		height="500"
		allowtransparency="true"
		frameborder="0"
		src="https://discord.com/widget?id=1221841177863651499&theme=dark"
		sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
	></iframe>
	<button
		id="social-popup-join"
		class="standard-button bottom-button large-button white"
		onclick={() => {
			playSound("basic_button");
			window.open($discordInviteUrl, "_blank").focus();

			setTimeout(async function () {
				closePopup();
				await addUserXP(7500);
			}, 250);
		}}
	>
		Join
		<img src="/img/discord.png" class="discord-icon-join" alt="Discord Icon" />
	</button>
</Popup>

<style>
	#social-popup-join {
		background-color: #8e44f0;
	}

	.experience-highlight {
		color: rgb(198, 255, 198);
		text-shadow: 0 0 10px #00cc00;
	}

	.discord-icon-join {
		width: 20px;
		height: auto;
		vertical-align: -2px;
		margin-left: 3px;
	}

	#discord-widget {
		margin-top: 30px;
		height: 100%;
		width: 100%;
		min-height: 300px;
		border-radius: var(--box-margin);
	}
</style>
