<script>
	import Popup from "$lib/components/Popup.svelte";
	import { HandHeart } from "lucide-svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { supporterWindowIfAuthenticated } from "$lib/utils/showSupporterPopup";
	import { preventExitPopup } from "$lib/stores/context-specific/platformSettingsStore";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";

	// Before Exit Popup ---------------------------------------------------------------
	let showExitIntentPopup = $state(false);
	let expandCostExpanded = $state(false);

	function exitIntentPopup() {
		if (localStorage.getItem("hideExitPopup") != "1" && !showExitIntentPopup && !get(preventExitPopup)) {
			showExitIntentPopup = true;
			expandCostExpanded = false;
			loadMonthlySupportedAmount();
		}
	}

	// Load Supporter amount ------------------------------------------------------------------
	let monthlySupportedAmount = $state("...");

	async function loadMonthlySupportedAmount() {
		try {
			const response = await fetch($accountUrl + "/stripe/statistics/current-month", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				console.error("Error occurred while loading monthly supported amount: " + response.status);
			} else {
				const data = await response.json();
				monthlySupportedAmount = data.supported_amount;
			}
		} catch (error) {
			console.error("Network error occured trying to load monthly supported amount: " + error);
		}
	}

	// Activate on Exit-Intent -------------------------------------------------------------------

	let exitBarTimeout;
	let exitBarDisabled = false;
	let lastMouseY;
	let isMouseInPage = false; // Flag to check if the mouse was previously outside the window

	onMount(() => {
		if (typeof window === "undefined") return;

		lastMouseY = window.innerHeight; // Start as the bottom of the window

		// Track mouse movements
		document.addEventListener("mousemove", (event) => {
			const currentMouseY = event.clientY;

			// Check if the mouse is entering the page for the first time
			if (!isMouseInPage) {
				isMouseInPage = true;
				lastMouseY = currentMouseY;
				return;
			}

			// Update lastMouseY only after mouse enters the page
			lastMouseY = currentMouseY;
		});

		// Reset mouse-in-page flag when the mouse leaves the window
		document.addEventListener("mouseleave", () => {
			isMouseInPage = false;
		});

		// Disable popup on top bar hover
		document.querySelectorAll(".topBarDesktop").forEach((e) => {
			e.addEventListener("mouseover", () => {
				clearTimeout(exitBarTimeout);
				exitBarDisabled = true;
				exitBarTimeout = setTimeout(() => {
					exitBarDisabled = false;
				}, 350);
			});
		});
	});

	function onCursorDetection(event) {
		const currentMouseY = event.clientY;
		// Trigger popup only if mouse is moving upwards and was inside the page before
		if (currentMouseY < lastMouseY && isMouseInPage) {
			if (!exitBarDisabled) {
				exitIntentPopup();
			}
		}
		// Update lastMouseY after checking
		lastMouseY = currentMouseY;
	}
</script>

{#if showExitIntentPopup}
	<Popup slim="true" z={981}>
		<div class="popup-title">
			<h1>Enjoy playing?</h1>
		</div>
		<div class="costDisplayArea">
			<div class="costFlex">
				<p class="costDisplayText">Supporter contributions this month:</p>
				<div class="costDisplayValue">
					<p>+$ {monthlySupportedAmount}</p>
				</div>
			</div>
			<button
				id="costSupportButton"
				class="standardButton costButton"
				onclick={() => {
					showExitIntentPopup = false;
					playSound("basic_button");
					supporterWindowIfAuthenticated();
				}}>Support OpenGuessr <span class="heartIconSpan"><HandHeart size="20" /></span></button
			>
		</div>
		<div id="costExplanationArea">
			<p id="costExplanationText" style:max-height={expandCostExpanded ? "5000px" : ""}>
				Maintaining a larger website, especially a web game that requires a robust infrastructure, is quite expensive.
				<br />
				<br />
				Servers, CDN costs and expenses related to security and development quickly add up. Moreover, working on new features,
				fixing bugs and ensuring that OpenGuessr is up and running, is extremely time consuming.
				<br />
				<br />
				If you enjoy playing, a small donation would help maintaining the site and funding future updates immensely. Thank
				you!
				<br />
				<br />
				<br />
			</p>
			<div id="costTextGradient"></div>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<p
				id="costExplanationToggle"
				onclick={() => {
					expandCostExpanded = !expandCostExpanded;
				}}
			>
				{expandCostExpanded ? "Show less" : "Read more"}
			</p>
		</div>
		<div class="exitSpacer"></div>
		<button
			id="beforeExitClose"
			class="standardButton white closeButton"
			onclick={() => {
				showExitIntentPopup = false;
				playSound("basic_button");
			}}>Close</button
		>
		<button
			id="beforeExitNotAgain"
			class="standardButton white closeButton"
			onclick={() => {
				showExitIntentPopup = false;
				localStorage.setItem("hideExitPopup", "1");
				playSound("basic_button");
			}}>Don't show again</button
		>
	</Popup>
{/if}

<!-- Used to detect the cursor leaving the iframe. Also loads this component immediately. -->

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div id="topCursorDetectionBar" onmouseover={onCursorDetection} role="alertdialog"></div>

<style>
	#beforeExitNotAgain {
		margin-right: 8px;
		opacity: 0.5;
	}

	.exitSpacer {
		width: 100%;
		height: 10px;
	}

	.heartIconSpan {
		vertical-align: -2px;
	}

	.costDisplayArea {
		border-radius: 10px;
		background: linear-gradient(30deg, rgba(37, 201, 72, 0.5), rgba(25, 215, 70, 0.7));
		color: white;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		padding: 5px;
		width: calc(100% - 10px);
		margin-top: 20px;
		gap: 7px;
		position: relative;
		z-index: 2;
	}

	#costExplanationArea {
		padding: 15px;
		background-color: rgba(30, 31, 44, 0.5);
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		border-bottom-right-radius: 10px;
		border-bottom-left-radius: 10px;
		margin-top: -10px;
		position: relative;
		z-index: 1;
		padding-top: 20px;
	}

	#costExplanationArea p {
		opacity: 0.75;
	}

	#costExplanationText {
		overflow: hidden;
		max-height: 65px;
		transition: max-height 500ms ease;
		text-overflow: ellipsis;
	}

	#costTextGradient {
		position: absolute;
		width: 100%;
		height: 75px;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(rgba(0, 0, 0, 0), rgb(34, 35, 45) 95%);
		border-radius: 10px;
	}

	.costDisplayValue {
		padding: 5px;
		padding-inline: 10px;
		background-color: rgba(0, 0, 0, 0.15);
		border-radius: 5px;
		flex-grow: 1;
		text-wrap: nowrap;
	}

	.costDisplayText {
		margin-left: 10px;
		flex-grow: 100;
	}

	#costExplanationToggle {
		position: absolute;
		right: 30px;
		bottom: 10px;
		text-shadow: 0 0 50px rgb(34, 35, 45);
		color: white;
		transition: opacity 250ms ease;
		cursor: pointer;
		text-decoration: underline;
	}

	#costExplanationToggle:hover {
		opacity: 0.5;
	}

	.costFlex {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-grow: 1;
		min-width: 100%;
		gap: 10px;
	}

	.costButton {
		margin: 0 !important;
		flex-grow: 1;
		background: linear-gradient(5deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.3));
		color: white;
		border: none;
	}

	#topCursorDetectionBar {
		position: fixed;
		top: 0;
		height: 15px;
		left: 0;
		right: 0;
		z-index: 990;
		/* above everything, except for error popups */
	}

	@media all and (max-width: 1200px) {
		#topCursorDetectionBar {
			display: none;
		}
	}
</style>