<script>
	import { playSound } from "$lib/utils/soundManager";
	import { Copy } from "@lucide/svelte";
	import { showNotification } from "$lib/utils/notifications";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { errorPopup } from "$lib/utils/errorHandling";
	import { extractCoordinates } from "$lib/utils/extractMapCoords";
	import Popup from "$lib/components/ui/Popup.svelte";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { goto } from "$app/navigation";
	import { restrictionNames } from "$lib/stores/context-specific/restrictionStore";
	import Drawer from "$lib/components/ui/Drawer.svelte";

	let successPopup = $state(false);

	// Competition Data
	let competitionName = $state();
	let competitionDuration = $state();
	let roundLength = $state();
	let competitionDescription = $state();
	let locationData = $state();
	let competitionPrivate = $state(false);
	let competitionRestriction = "standard";

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
			// Create links
			enterLink = window.location.origin + "/competitions?enter=" + competitionCreationId;
			leaderboardLink = window.location.origin + "/competitions?leaderboard=" + competitionCreationId;
			successPopup = true;
		} else {
			errorPopup("Error submitting competition", "An error occured submitting your competition.", operationMessage);
		}
	}

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

	// Toggle Restrictions
	let restrictions = Object.keys($restrictionNames);
	let currentRestrictionIndex = 0;
	let competitionRestrictionText = $state($restrictionNames[restrictions[0]]);

	function togglecompetitionRestriction() {
		currentRestrictionIndex = (currentRestrictionIndex + 1) % restrictions.length;
		competitionRestriction = restrictions[currentRestrictionIndex];
		competitionRestrictionText = $restrictionNames[restrictions[currentRestrictionIndex]];
	}

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
	<h1 class="textHeaderLeft">Competition created!</h1>
	<p>
		Thank you for creating a competition! Share these links with others and save them if your competition is private.
	</p>
	<div class="spacer"></div>
	<div>
		<p class="linkTitle">Enter link</p>
		<div class="linkBox linkBoxMargin">
			<p>{enterLink || "https://example.com"}</p>
			<button
				class="standardButton white"
				onclick={() => {
					playSound("basic_button");
					navigator.clipboard
						.writeText(enterLink)
						.then(() => showNotification("Copied!"))
						.catch((error) => showNotification("Error: " + error));
				}}><Copy size="18" strokeWidth={2.5} /></button
			>
		</div>
		<p class="linkTitle">Leaderboard link</p>
		<div class="linkBox">
			<p>{leaderboardLink || "https://example.com"}</p>
			<button
				class="standardButton white"
				onclick={() => {
					playSound("basic_button");
					navigator.clipboard
						.writeText(leaderboardLink)
						.then(() => showNotification("Copied!"))
						.catch((error) => showNotification("Error: " + error));
				}}><Copy size="18" strokeWidth={2.5} /></button
			>
		</div>
	</div>
</Popup>

<div class="main-container">
	<div class="contentArea">
		<div class="formLayout">
			<!-- Left column: Settings -->
			<div class="formColumn">
				<div class="formSection">
					<h3 class="sectionTitle">Details</h3>
					<div class="fieldGroup">
						<p class="fieldLabel">Name</p>
						<input bind:value={competitionName} type="text" placeholder="My competition" maxlength="30" />
					</div>
					<div class="fieldGroup">
						<p class="fieldLabel">Description</p>
						<input
							bind:value={competitionDescription}
							type="text"
							placeholder="This competition features..."
							maxlength="70"
						/>
					</div>
				</div>

				<div class="formSection">
					<h3 class="sectionTitle">Settings</h3>
					<div class="settingsGrid">
						<div class="fieldGroup">
							<p class="fieldLabel">Round length (seconds)</p>
							<input bind:value={roundLength} type="text" placeholder="60" maxlength="30" />
						</div>
						<div class="fieldGroup">
							<p class="fieldLabel">Duration (d, h, min)</p>
							<input bind:value={competitionDuration} type="text" placeholder="2d 6h" maxlength="30" />
						</div>
						<div class="fieldGroup">
							<p class="fieldLabel">Visibility</p>
							<button
								class="standardButton white largeButton toggleButton"
								onclick={() => {
									playSound("basic_button");
									competitionPrivate = !competitionPrivate;
								}}>{competitionPrivate ? "Private" : "Public"}</button
							>
						</div>
						<div class="fieldGroup">
							<p class="fieldLabel">Restriction</p>
							<button
								class="standardButton white largeButton toggleButton"
								onclick={() => {
									playSound("basic_button");
									togglecompetitionRestriction();
								}}>{competitionRestrictionText}</button
							>
						</div>
					</div>
				</div>

				<Drawer title="Rules" inPage={true} hasBottomLayoutMargin={false}>
					<div class="locationInstructions">
						<ul class="rulesList">
							<li>Keep all details in English</li>
							<li>Pick a descriptive competition name</li>
							<li>Competitions will be deleted 7 days after they have ended</li>
							<li>Competitions cannot be edited</li>
							<li>The duration must be between 10min and 7d</li>
							<li>The number of locations equals the amount of rounds</li>
						</ul>
					</div>
				</Drawer>
			</div>

			<!-- Right column: Locations -->
			<div class="formColumn locationsColumn">
				<div class="formSection locationsSection">
					<h3 class="sectionTitle sectionTitleMargin">Locations</h3>
					<div class="locationInstructions">
						<p class="instructionsTitle">Instructions</p>
						<ol>
							<li>
								Visit <a href="https://www.google.com/maps/" target="_blank">Google Maps</a> on a desktop computer
							</li>
							<li>Drag the orange figure onto the map to open a streetview</li>
							<li>Copy the URL from the address bar into the textbox</li>
						</ol>
					</div>
					<p class="fieldLabel">Street View URLs (fixed order, max. 20)</p>
					<div class="textAreaBox">
						<textarea
							bind:value={locationData}
							class="of-top of-bottom"
							rows="5"
							placeholder="https://www.google.com/maps/@44.4271593,20.8858906,3a,75y,2.85h,90t/data=..."
						></textarea>
					</div>
				</div>
			</div>
		</div>

		<div class="submitArea barMenu">
			<button
				class="standardButton largeButton"
				onclick={() => {
					playSound("basic_button");
					showConfirmPopup("Submit?", "Competitions cannot be edited or deleted.", () => {
						submitCompetitionWithDetails();
					});
				}}>Submit</button
			>
		</div>
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: calc(100dvh - 120px);
	}

	.contentArea {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 900px;
		margin-top: auto;
		margin-bottom: auto;
		padding-bottom: 50px;
	}

	.linkTitle {
		margin-bottom: var(--content-margin);
	}

	.sectionTitle {
		margin-left: var(--content-margin);
	}

	.sectionTitleMargin {
		margin-bottom: var(--content-margin);
	}

	.formLayout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--layout-margin);
		width: 100%;
	}

	.formColumn {
		display: flex;
		flex-direction: column;
		gap: var(--layout-margin);
		min-width: 0;
	}

	.formSection {
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
	}

	.fieldGroup {
		display: flex;
		flex-direction: column;
		gap: var(--content-margin);
		min-width: 0;
	}

	.fieldLabel {
		opacity: 0.75;
		margin-top: var(--content-margin);
		margin-left: var(--content-margin);
		margin-bottom: 3px;
	}

	.fieldGroup input {
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		border-radius: var(--box-margin);
	}

	.settingsGrid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--box-margin);
	}

	.toggleButton {
		width: 100%;
	}

	ul:first-child {
		margin-top: var(--content-margin);
	}

	.locationsSection {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	.locationInstructions {
		background-color: var(--box-color-dark);
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		box-shadow: var(--box-shadow);
	}

	.instructionsTitle {
		margin-bottom: var(--box-margin);
	}

	.locationInstructions li {
		opacity: 0.75;
	}

	textarea {
		padding: var(--layout-margin);
		min-height: 100%;
		width: 100%;
	}

	.textAreaBox {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		overflow: hidden;
		min-height: 200px;
		flex-grow: 1;
	}

	.submitArea {
		margin-top: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--layout-margin);
	}

	.submitArea button {
		padding-inline: 30px;
	}

	/* Popup styles */
	.textHeaderLeft {
		margin-bottom: var(--layout-margin);
	}

	.spacer {
		height: 20px;
		width: 100%;
	}

	.linkBox {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		padding: var(--box-margin);
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
	}

	.linkBox p {
		flex-grow: 1;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		margin-inline: var(--content-margin);
	}

	.linkBoxMargin {
		margin-bottom: var(--box-margin);
	}

	@media (max-width: 1300px) {
		.formLayout {
			grid-template-columns: 1fr;
		}

		.settingsGrid {
			grid-template-columns: 1fr;
		}

		.locationsColumn {
			order: 1;
		}
	}
</style>
