<script>
	import { playSound } from "$lib/utils/soundManager";
	import { username } from "$lib/stores/accountStore";
	import { Copy, Link } from "@lucide/svelte";
	import { showNotification } from "$lib/utils/notifications";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { extractCoordinates, getJsonStringFromFile } from "$lib/utils/extractMapCoords";
	import Popup from "$lib/components/ui/Popup.svelte";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { goto } from "$app/navigation";
	import { restrictionNames } from "$lib/stores/context-specific/restrictionStore";

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
			errorPopup("Error submitting competition", "An error occured submitting your competition.", operationMessage);
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
	let restrictions = Object.keys($restrictionNames);
	let currentRestrictionIndex = 0;
	let competitionRestrictionText = $state($restrictionNames[restrictions[0]]);

	function togglecompetitionRestriction() {
		currentRestrictionIndex = (currentRestrictionIndex + 1) % restrictions.length;

		competitionRestriction = restrictions[currentRestrictionIndex];
		competitionRestrictionText = $restrictionNames[restrictions[currentRestrictionIndex]];
	}

	// Submission function ------------------------------------------------------------------------------------------------------
	async function submitCompetition(
		name,
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
				id: authorId,
				restriction: restriction,
				duration: duration,
				roundLength: roundLength,
				description: description,
				rawLocations: rawLocations,
				private: isPrivate,
			};

			const response = await fetch($apiUrl + "/competitions/create", {
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

					if (responseData.error) errorMessages.push(responseData.error);
					if (responseData.message) errorMessages.push(responseData.message);

					if (responseData.errors && Array.isArray(responseData.errors)) {
						responseData.errors.forEach((err) => {
							if (err.msg) errorMessages.push(err.msg);
							else errorMessages.push(JSON.stringify(err));
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

<svelte:head>
	<title>Create competition</title>
</svelte:head>

<Popup
	verySlim={true}
	bind:open={successPopup}
	onclose={() => {
		goto("/competitions");
	}}
>
	<h1 id="submitConfirmHeader" class="textHeaderLeft">Competition created!</h1>
	<p>
		Thank you for creating a competition! Share these links with others and save them if your competition is private.
	</p>
	<div class="spacer"></div>
	<div>
		<p>Enter link</p>
		<div class="linkBox">
			<p>{enterLink}</p>
			<button
				id="copyLinksButton"
				class="standardButton white"
				onclick={() => {
					playSound("basic_button");
					navigator.clipboard
						.writeText(enterLink)
						.then(function () {
							showNotification("Copied!");
						})
						.catch(function (error) {
							showNotification("Error: " + error);
						});
				}}><Copy size="18" strokeWidth={2.5} /></button
			>
		</div>
		<p>Leaderboard link</p>
		<div class="linkBox">
			<p>{leaderboardLink}</p>
			<button
				id="copyLinksButton"
				class="standardButton white"
				onclick={() => {
					playSound("basic_button");
					navigator.clipboard
						.writeText(leaderboardLink)
						.then(function () {
							showNotification("Copied!");
						})
						.catch(function (error) {
							showNotification("Error: " + error);
						});
				}}><Copy size="18" strokeWidth={2.5} /></button
			>
		</div>
	</div>
</Popup>

<div class="mainContainer">
	<h1 class="header" id="uploadHeader">Create a competition</h1>
	<div class="infoNoteBox">
		<p class="uploadFirstText">Rules</p>
		<ul>
			<li>Keep all details in English.</li>
			<li>Pick a descriptive competition name.</li>
			<li>Competitions will be deleted 7 days after they have ended.</li>
			<li>Competitions cannot be edited.</li>
			<li>The duration must be between 10min and 7d.</li>
			<li>The number of locations equals the amount of rounds.</li>
		</ul>
	</div>
	<div id="inputArea">
		<p class="marginTop">Competition name</p>
		<input
			id="uploadCompetitionName"
			bind:value={competitionName}
			class="uploadInfo"
			type="text"
			style="width: 220px"
			placeholder="Name of your competition..."
			maxlength="30"
		/>
		<p>Competition description</p>
		<input
			id="uploadCompetitionDescription"
			bind:value={competitionDescription}
			class="uploadInfo"
			type="text"
			placeholder="Description..."
			maxlength="70"
		/>
		<p>Round length (seconds)</p>
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
		<p>Duration (min, h & d)</p>
		<input
			id="uploadCompetitionDuration"
			class="uploadInfo"
			type="text"
			bind:value={competitionDuration}
			style="width: 150px"
			placeholder="2d"
			maxlength="30"
		/>
		<p>Visibility</p>
		<button
			class="standardButton white toggleButton largeButton"
			onclick={() => {
				playSound("basic_button");
				competitionPrivate = !competitionPrivate;
			}}>{competitionPrivate ? "Private" : "Public"}</button
		>
		<div class="spacer"></div>
		<p>Restriction</p>
		<button
			class="standardButton white toggleButton largeButton"
			onclick={() => {
				playSound("basic_button");
				togglecompetitionRestriction();
			}}>{competitionRestrictionText}</button
		>
		<div class="spacer"></div>
		<div class="infoNoteBox marginBottom">
			<p class="uploadFirstText">How to add locations</p>
			<ol>
				<li>
					Visit <a href="https://www.google.com/maps/" target="_blank">Google Maps</a> on a desktop computer.
				</li>
				<li>Drag the orange figure onto the map to open a streetview.</li>
				<li>Copy the URL from the address bar of your browser into the textbox.</li>
			</ol>
		</div>
		<div class="spacer"></div>
		<p>Locations (fixed order, max. 20)</p>
		<textarea
			id="uploadLocationData"
			bind:value={locationData}
			class="uploadInfo locationTextbox"
			type="text"
			rows="20"
			placeholder="https://www.google.de/maps/@44.4271593,20.8858906,3a,75y,2.85h,90t/data=!3m6!1e1!3m4!1sux2El-iXh3zIk2rVfhDP5w!2e0!7i13312!8i6656?coh=205409&entry=ttu
      
https://www.google.de/maps/@50.3874953,11.2149744,3a,75y,327.9h,88.34t/data=!3m6!1e1!3m4!1scgVGr1HY1alolDg8gfwrzA!2e0!7i16384!8i8192?coh=205409&entry=ttu
      
https://www.google.de/maps/@50.3876752,11.2149082,3a,75y,13.59h,100.92t/data=!3m6!1e1!3m4!1sUaKFi34dUCFjIgkE5dQw1Q!2e0!7i16384!8i8192?coh=205409&entry=ttu"
		></textarea>
	</div>
	<div class="buttonContainer">
		<button
			id="uploadConfirm"
			class="standardButton bottomButton largeButton submitButton"
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
		padding-inline: var(--box-margin);
	}

	#uploadHeader {
		margin-bottom: 30px;
	}

	.textHeaderLeft {
		margin-bottom: var(--layout-margin);
	}

	.buttonContainer {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.submitButton {
		border-radius: var(--box-margin);
		margin-top: var(--box-margin);
		margin-bottom: var(--layout-margin);
	}

	.infoNoteBox {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		padding-inline: 20px;
		display: flex;
		justify-content: flex-start;
		flex-direction: column;
		width: calc(100% - 40px);
		box-shadow: var(--box-shadow);
	}

	.linkBox {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		margin-bottom: var(--layout-margin);
		padding: var(--box-margin);
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		margin-top: var(--box-margin);
		width: fit-content;
		box-shadow: var(--box-shadow);
		max-width: 100%;
		box-sizing: border-box;
	}

	.linkBox p {
		text-overflow: ellipsis;
		overflow: hidden;
		text-wrap: nowrap;
	}

	#inputArea {
		display: flex;
		justify-content: flex-start;
		flex-direction: column;
		width: 100%;
		margin-top: var(--layout-margin);
	}

	.uploadFirstText {
		margin-bottom: var(--layout-margin);
		margin-top: var(--box-margin);
		font-size: 22px;
	}

	.spacer {
		height: 20px;
		width: 100%;
	}

	.uploadInfo {
		border-radius: var(--box-margin);
		width: 75%;
		min-height: 30px;
		border: none;
		padding: var(--box-margin);
		padding-inline: 20px;
		margin-bottom: 20px;
		margin-top: var(--box-margin);
		color: white;
	}

	.locationTextbox {
		box-sizing: border-box;
		min-height: 350px;
		font-size: 16px;
		width: 100%;
		padding: 20px;
		transition: background-color 250ms ease;
	}

	.locationTextbox:focus {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.marginTop {
		margin-top: var(--layout-margin);
	}

	li {
		color: white;
		font-size: 22px;
	}

	.toggleButton {
		margin-top: var(--box-margin);
		min-width: 150px;
	}
</style>
