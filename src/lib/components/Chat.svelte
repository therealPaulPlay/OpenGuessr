<script>
	import { chatHTML, chatVisible } from "$lib/stores/context-specific/multiplayerStore";
	import { manuallySendChat } from "$lib/utils/chatFunctions";
	import { playSound } from "$lib/utils/soundManager";
	import RemainingGuessesDisplay from "$lib/components/RemainingGuessesDisplay.svelte";

	let multiplayerChatMessages = $state();
	let inputValue = $state();

	chatHTML.subscribe((value) => {
		try {
			if (multiplayerChatMessages) {
				setTimeout(() => {
					multiplayerChatMessages.scrollTop = multiplayerChatMessages.scrollHeight;
				}, 50);
			}
		} catch (error) {
			console.error("Error setting chat box scroll value:", error);
		}
	});
</script>

<div class="chatContainer" style:display={$chatVisible ? "flex" : "none"}>
	<div id="multiplayerChat">
		<RemainingGuessesDisplay />
		<div id="multiplayerChatMessages" bind:this={multiplayerChatMessages}>
			<p id="multiplayerMessageBox" bind:innerHTML={$chatHTML} contenteditable="false"></p>
		</div>
		<div id="bottomMultiplayerChatArea">
			<input
				maxlength="100"
				type="text"
				id="multiplayerMessageInput"
				placeholder="Type your message..."
				bind:value={inputValue}
				onkeydown={(event) => {
					if (event.key == "Enter") {
						event.preventDefault();
						manuallySendChat(inputValue);
						inputValue = "";
					}
				}}
			/>
			<button
				id="multiplayerSendButton"
				class="standardButton"
				onclick={() => {
					playSound("basic_button");
					manuallySendChat(inputValue);
					inputValue = "";
				}}>Send</button
			>
		</div>
	</div>
</div>

<style>
	#multiplayerChat {
		width: 100%;
		height: 15vh;
		max-height: 250px;
		min-height: 150px;
		border-radius: 10px;
		overflow: hidden;
		flex-direction: column;
		align-items: center;
		display: flex;
		background-color: var(--panel-color);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow: 0 2px 20px rgba(5, 6, 10, 0.3);
		font-size: 20px;
	}

	.chatContainer {
		left: 10px;
		bottom: 76px;
		justify-content: flex-end;
		align-items: center;
		z-index: 10;
		position: fixed;
		height: fit-content;
		flex-direction: column;
		width: 300px;
		gap: 8px;
	}

	#bottomMultiplayerChatArea {
		display: flex;
		justify-content: space-around;
		align-items: center;
		width: 100%;
	}

	#multiplayerChatMessages {
		height: 100%;
		width: 100%;
		overflow-y: scroll;
		display: flex;
		scrollbar-width: none;
		flex-direction: column;
		margin-top: 5px;
	}

	#multiplayerMessageBox {
		color: white;
		margin: 10px;
		line-height: 1.7;
		margin-top: auto;
		font-size: 20px;
	}

	#multiplayerSendButton {
		height: 37px;
		margin: 8px;
		margin-left: 8px;
		padding-inline: 12px;
		font-size: 20px;
	}

	#multiplayerMessageInput {
		padding: 10px;
		border: none;
		border-radius: 5px;
		font-size: 20px;
		height: 17px;
		overflow: scroll;
		text-wrap: wrap;
		flex-grow: 1;
		margin: 8px;
		margin-right: 0px;
	}

	@media all and (max-width: 1200px) {
		/* Chat doesn't fit on smaller screens */
		#multiplayerChat {
			display: none;
		}
	}
</style>
