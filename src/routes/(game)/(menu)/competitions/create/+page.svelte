<script>
	import { playSound } from "$lib/utils/soundManager";
	import { username } from "$lib/stores/accountStore";
	import { Link } from "lucide-svelte";
	import { showNotification } from "$lib/utils/notifications";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { extractCoordinates, getJsonStringFromFile } from "$lib/utils/extractMapCoords";
	import Popup from "$lib/components/ui/Popup.svelte";
	import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";

	let competitionSubmittedSuccessfully = false;
	let successPopup = $state(false);

	// Competition Data
	let competitionName = $state();
	let competitionDuration = $state();
	let roundLength = $state();
	let competitionDescription = $state();
	let locationData = $state();
	let competitionPrivate = $state(false);
	let competitionRestriction = "standard";

	// submit with all details
	let competitionCreationId;

	// Links
	let enterLink = $state();
	let leaderboardLink = $state();

	async function submitCompetitionWithDetails() {
		let operationMessage = await submitCompetition(
			competitionName,
			$username,
			localStorage.getItem("id"),
			competitionRestriction,
			convertToSeconds(competitionDuration),
			convertToSeconds(roundLength),
			competitionDescription,
			extractCoordinates(locationData),
			competitionPrivate,
		);

		if (operationMessage.includes("success")) {
			// create links
			enterLink = window.location.origin + "/competitions?enter=" + competitionCreationId;
			leaderboardLink = window.location.origin + "/competitions?leaderboard=" + competitionCreationId;

			successPopup = true;
		} else {
			errorPopup("Error submitting a competition", "An error occured submitting your competition.", operationMessage);
		}
	}

	// Get seconds from string time input -------------------------------------------------------------------------------

	function convertToSeconds(input) {
		try {
			const pattern = /(\d+)\s*d|(\d+)\s*h|(\d+)\s*min|(\d+)\s*s|\d+/gi;
			let totalSeconds = 0;
			const matches = input.match(pattern);
			if (matches) {
				matches.forEach((match) => {
					let value = parseInt(match);
					if (match.includes("d")) {
						totalSeconds += value * 86400;
					} else if (match.includes("h")) {
						totalSeconds += value * 3600;
					} else if (match.includes("min")) {
						totalSeconds += value * 60;
					} else if (match.includes("s")) {
						totalSeconds += value;
					} else {
						totalSeconds += value;
					}
				});
			}
			return totalSeconds;
		} catch (error) {
			console.error("Error occured when extracting time seconds from inputs: " + error);
			return null;
		}
	}

	// Toggle Restrictions & Visibility ---------------------------------------------------------------------------------------------

	let competitionRestrictionText = $state("Standard");

	let restrictions = ["standard", "nmpz", "grayscale", "invert", "hue", "fade"];
	let restrictionsText = ["Standard", "NMPZ", "Grayscale", "Invert Colors", "Hue Shift", "Blink (Fade)"];
	let currentRestrictionIndex = 0;

	function togglecompetitionRestriction() {
		currentRestrictionIndex = (currentRestrictionIndex + 1) % restrictions.length;

		competitionRestriction = restrictions[currentRestrictionIndex];
		competitionRestrictionText = restrictionsText[currentRestrictionIndex];
	}

	// Submission function ------------------------------------------------------------------------------------------------------

	async function submitCompetition(
		name,
		author,
		authorId,
		restriction,
		duration,
		roundLength,
		description,
		rawLocations,
		isPrivate,
	) {
		try {
			const requestBody = {
				name: name,
				author: author,
				id: authorId,
				restriction: restriction,
				duration: duration,
				roundLength: roundLength,
				description: description,
				rawLocations: rawLocations,
				private: isPrivate,
			};

			const response = await fetch($accountUrl + "/competitions/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ` + localStorage.getItem("bearer"),
				},
				body: JSON.stringify(requestBody),
			});

			if (response.ok) {
				competitionSubmittedSuccessfully = true;

				try {
					const data = await response.json();
					competitionCreationId = data.competitionId;
				} catch (e) {
					console.error("Error extracting competitionId from creation response: " + e);
				}

				return "Competition created successfully. Good luck and have fun!";
			} else {
				let responseData = null;

				try {
					responseData = await response.json();

					let errorMessages = [];

					if (responseData.error) {
						errorMessages.push(responseData.error);
					}

					if (responseData.message) {
						errorMessages.push(responseData.message);
					}

					if (responseData.errors && Array.isArray(responseData.errors)) {
						responseData.errors.forEach((err) => {
							if (err.msg) {
								errorMessages.push(err.msg);
							} else {
								errorMessages.push(JSON.stringify(err));
							}
						});
					}

					return errorMessages.join(" ");
				} catch {
					return "Error occured on server and response did not include a json response.";
				}
			}
		} catch (error) {
			console.error("Error occurred during competition submission: ", error);
			return "A network error has occurred.";
		}
	}
</script>

{#if successPopup}
	<Popup verySlim={true}>
		<h1 id="submitConfirmHeader" class="textHeaderLeft">Success!</h1>
		<p>Thank you for creating a competition! Share these direct links with your friends:</p>
		<div class="spacer"></div>
		<div class="linkBox">
			<p>Enter link:</p>
			<p class="linkField">{enterLink}</p>
			<div class="spacer"></div>
			<p>Leaderboard link:</p>
			<p class="linkField">{leaderboardLink}</p>
			<button
				id="copyLinksButton"
				class="standardButton white copyButton"
				onclick={() => {
					playSound("basic_button");
					navigator.clipboard
						.writeText(enterLink + " " + leaderboardLink)
						.then(function () {
							showNotification("Copied!");
						})
						.catch(function (error) {
							showNotification("Error: " + error);
						});
				}}><Link size="16" strokeWidth={2.5} style="margin-right: 3px;" /> Copy Both</button
			>
			<div class="buttonBoxRight">
				<button
					class="standardButton closeButton white"
					onclick={() => {
						playSound("basic_button");
						successPopup = false;
					}}>Close</button
				>
			</div>
		</div>
	</Popup>
{/if}

<div class="mainContainer">
	<h1 class="header" id="uploadHeader">Create a Competition</h1>
	<div class="infoNoteBox">
		<p class="uploadFirstText">Information and rules:</p>
		<ul class="verticalMarginUl">
			<li class="helpItem">Ensure that your competition names and author names are familiy-friendly.</li>
			<li class="helpItem">Keep all details in english.</li>
			<li class="helpItem">Pick a descriptive competition name (e.g. not "My Competition").</li>
			<li class="helpItem">Competitions will be deleted 7 days after they have ended.</li>
			<li class="helpItem">Competitions cannot be edited.</li>
			<li class="helpItem">The duration must be between 10min and 7d.</li>
			<li class="helpItem">The number of locations equals the amount of rounds.</li>
		</ul>
	</div>
	<div id="inputArea">
		<p class="marginTop">Competition name:</p>
		<input
			id="uploadCompetitionName"
			bind:value={competitionName}
			class="uploadInfo"
			type="text"
			style="width: 220px"
			placeholder="Name of your competition..."
			maxlength="30"
		/>
		<p>Competition description:</p>
		<input
			id="uploadCompetitionDescription"
			bind:value={competitionDescription}
			class="uploadInfo"
			type="text"
			placeholder="Description..."
			maxlength="70"
		/>
		<div class="infoNoteBox marginBottom">
			<p class="uploadFirstText">Information regarding private competitions:</p>
			<p id="visibilityInfo">
				Competitions are public by default, meaning they appear on the site for everyone. Private competitions can only
				be accessed via the link, so make sure not to lose it.
			</p>
		</div>
		<div class="spacer"></div>
		<p>Visibility:</p>
		<button
			class="standardButton white toggleButton"
			onclick={() => {
				playSound("basic_button");
				competitionPrivate = !competitionPrivate;
			}}>{competitionPrivate ? "Private" : "Public"}</button
		>
		<div class="spacer"></div>
		<p>Restriction:</p>
		<button
			class="standardButton white toggleButton"
			onclick={() => {
				playSound("basic_button");
				togglecompetitionRestriction();
			}}>{competitionRestrictionText}</button
		>
		<div class="spacer"></div>
		<p>Round length (seconds):</p>
		<div class="extendedInputBox">
			<input
				id="uploadCompetitionRoundLength"
				bind:value={roundLength}
				class="uploadInfo"
				type="text"
				style="width: 150px"
				placeholder="60"
				maxlength="30"
			/>
		</div>
		<p>Duration (use min, h and d):</p>
		<input
			id="uploadCompetitionDuration"
			class="uploadInfo"
			type="text"
			bind:value={competitionDuration}
			style="width: 150px"
			placeholder="2d"
			maxlength="30"
		/>
		<div class="spacer"></div>
		<div class="infoNoteBox marginBottom">
			<p class="uploadFirstText">How to add locations:</p>
			<ol>
				<li class="helpItem">
					Visit <a href="https://www.google.com/maps/" target="_blank">Google Maps</a> on a desktop computer.
				</li>
				<li class="helpItem">Drag the orange figure onto the map to open a streetview.</li>
				<li class="helpItem">Copy the URL from the address bar of your browser into the textbox.</li>
			</ol>
		</div>
		<div class="spacer"></div>
		<p>Locations (fixed order, max. 20):</p>
		<textarea
			id="uploadLocationData"
			bind:value={locationData}
			class="uploadInfo locationTextbox"
			type="text"
			rows="20"
			placeholder="
  https://www.google.de/maps/@44.4271593,20.8858906,3a,75y,2.85h,90t/data=!3m6!1e1!3m4!1sux2El-iXh3zIk2rVfhDP5w!2e0!7i13312!8i6656?coh=205409&entry=ttu
  
  https://www.google.de/maps/@50.3874953,11.2149744,3a,75y,327.9h,88.34t/data=!3m6!1e1!3m4!1scgVGr1HY1alolDg8gfwrzA!2e0!7i16384!8i8192?coh=205409&entry=ttu
  
  https://www.google.de/maps/@50.3876752,11.2149082,3a,75y,13.59h,100.92t/data=!3m6!1e1!3m4!1sUaKFi34dUCFjIgkE5dQw1Q!2e0!7i16384!8i8192?coh=205409&entry=ttu"
			maxlength="50000"
		></textarea>
	</div>
	<div class="buttonBoxRight fullWidth noMarginTop">
		<button
			id="uploadConfirm"
			class="standardButton closeButton submitButton"
			onclick={() => {
				playSound("basic_button");
				showConfirmPopup("Submit?", "Competitions cannot be edited or deleted.", () => {
					submitCompetitionWithDetails();
				});
			}}>Submit</button
		>
	</div>
</div>

<style>
	.mainContainer {
		width: calc(100% - 20px);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		padding-inline: 10px;
	}

	#uploadHeader {
		margin-bottom: 30px;
	}

	.noMarginTop {
		margin-top: 0;
	}

	.textHeaderLeft {
		margin-bottom: 15px;
	}

	.fullWidth {
		width: 100%;
	}

	.submitButton {
		border-radius: 10px;
		margin-top: 0;
	}

	.infoNoteBox {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 10px;
		padding: 10px;
		padding-inline: 20px;
		display: flex;
		justify-content: flex-start;
		flex-direction: column;
		width: calc(100% - 40px);
	}

	#inputArea {
		display: flex;
		justify-content: flex-start;
		flex-direction: column;
		width: 100%;
		margin-top: 15px;
	}

	#visibilityInfo {
		margin-bottom: 10px;
	}

	.uploadFirstText {
		margin-bottom: 15px;
		margin-top: 10px;
		font-size: 22px;
	}

	.spacer {
		height: 20px;
		width: 100%;
	}

	.uploadInfo {
		border-radius: 10px;
		outline: none;
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
		width: 75%;
		font-size: 22px;
		min-height: 30px;
		font-family: Barlow;
		border: none;
		padding: 10px;
		padding-inline: 20px;
		margin-bottom: 20px;
		margin-top: 10px;
		transition: background-color 250ms ease;
	}

	.uploadInfo:focus {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.locationTextbox {
		min-height: 350px;
		font-size: 12px;
		width: calc(100% - 30px);
		padding: 15px;
	}

	.marginTop {
		margin-top: 15px;
	}

	.copyButton {
		margin-top: 25px;
		margin-left: 0;
	}

	li {
		color: white;
		font-size: 22px;
	}

	.toggleButton {
		margin-top: 10px;
		border-radius: 10px;
		min-height: 50px;
		min-width: 150px;
	}
</style>
