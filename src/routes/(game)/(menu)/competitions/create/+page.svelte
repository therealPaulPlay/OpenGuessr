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
	import { defaultRestriction, restrictionNames } from "$lib/stores/context-specific/restrictionStore";
	import Drawer from "$lib/components/ui/Drawer.svelte";

	let successPopup = $state(false);

	// Competition Data
	let competitionName = $state();
	let competitionDuration = $state();
	let roundLength = $state();
	let competitionDescription = $state();
	let locationData = $state();
	let competitionPrivate = $state(false);
	let competitionRestriction = $state($defaultRestriction); // Not the display text, but the value

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

	async function submitCompetition(
		name,
		authorId,
		restriction,
		duration,
		roundLength,
		description,
		locations,
		isPrivate,
	) {
		try {
			const requestBody = {
				name,
				id: authorId,
				restriction,
				duration,
				roundLength,
				description,
				locations,
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
	<h1 class="text-header-left">Competition created!</h1>
	<p>
		Thank you for creating a competition. Share these links with others and save them if your competition is private.
	</p>
	<div class="spacer"></div>
	<div>
		<p class="link-title">Enter link</p>
		<div class="link-box link-box-margin">
			<p>{enterLink || "https://example.com"}</p>
			<button
				class="standard-button white"
				onclick={() => {
					playSound("basic_button");
					navigator.clipboard
						.writeText(enterLink)
						.then(() => showNotification("Copied!"))
						.catch((error) => showNotification("Error: " + error));
				}}><Copy size="18" strokeWidth={2.5} /></button
			>
		</div>
		<p class="link-title">Leaderboard link</p>
		<div class="link-box">
			<p>{leaderboardLink || "https://example.com"}</p>
			<button
				class="standard-button white"
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
	<div class="content-area">
		<div class="form-layout">
			<!-- Left column: Settings -->
			<div class="form-column">
				<div class="form-section">
					<h3 class="section-title">Details</h3>
					<div class="field-group">
						<p class="field-label">Name</p>
						<input bind:value={competitionName} type="text" placeholder="My competition" maxlength="30" />
					</div>
					<div class="field-group">
						<p class="field-label">Description</p>
						<input
							bind:value={competitionDescription}
							type="text"
							placeholder="This competition features..."
							maxlength="70"
						/>
					</div>
				</div>

				<Drawer title="Rules" hasBottomLayoutMargin={false}>
					<div class="location-instructions">
						<ul class="rules-list">
							<li>Keep all details in English</li>
							<li>Pick a descriptive competition name</li>
							<li>Competitions will be deleted 7 days after they have ended</li>
							<li>Competitions cannot be edited</li>
							<li>The duration must be between 10min and 7d</li>
							<li>The number of locations equals the amount of rounds</li>
						</ul>
					</div>
				</Drawer>

				<div class="form-section">
					<h3 class="section-title">Settings</h3>

					<div class="field-group">
						<p class="field-label">Round length (seconds)</p>
						<input bind:value={roundLength} type="text" placeholder="60" maxlength="30" />
					</div>
					<div class="field-group">
						<p class="field-label">Duration (d, h, min)</p>
						<input bind:value={competitionDuration} type="text" placeholder="2d 6h" maxlength="30" />
					</div>
					<div class="settings-grid">
						<div class="field-group">
							<p class="field-label">Visibility</p>
							<button
								class="standard-button white large-button toggle-button"
								onclick={() => {
									playSound("basic_button");
									competitionPrivate = !competitionPrivate;
								}}>{competitionPrivate ? "Private" : "Public"}</button
							>
						</div>
						<div class="field-group">
							<p class="field-label">Restriction</p>
							<select
								class="standard-button white large-button toggle-button"
								bind:value={competitionRestriction}
								onchange={() => {
									playSound("basic_button");
								}}
							>
								{#each Object.entries($restrictionNames) as [key, value]}
									<option value={key}>{value}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>

			<!-- Right column: Locations -->
			<div class="form-column locations-column">
				<div class="form-section locations-section">
					<h3 class="section-title section-title-margin">Locations</h3>
					<div class="location-instructions">
						<p class="instructions-title">Instructions</p>
						<ol>
							<li>
								Visit <a href="https://www.google.com/maps/" target="_blank">Google Maps</a> on a desktop computer
							</li>
							<li>Drag the orange figure onto the map to open a streetview</li>
							<li>Copy the URL from the address bar into the textbox</li>
						</ol>
					</div>
					<p class="field-label">Street View URLs (fixed order, max. 20)</p>
					<div class="text-area-box">
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

		<div class="submit-area bar-menu">
			<button
				class="standard-button large-button"
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

	.content-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 900px;
		margin-top: auto;
		margin-bottom: auto;
	}

	.link-title {
		margin-bottom: var(--content-margin);
	}

	.section-title {
		margin-left: var(--content-margin);
	}

	.section-title-margin {
		margin-bottom: var(--content-margin);
	}

	.form-layout {
		display: grid;
		grid-template-columns: 3fr 4fr;
		gap: var(--layout-margin);
		width: 100%;
	}

	.form-column {
		display: flex;
		flex-direction: column;
		gap: var(--layout-margin);
		min-width: 0;
	}

	.form-section {
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		box-shadow: var(--panel-shadow);
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: var(--content-margin);
		min-width: 0;
	}

	.field-label {
		opacity: 0.75;
		margin-top: var(--content-margin);
		margin-left: var(--content-margin);
		margin-bottom: 3px;
	}

	.field-group input {
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		border-radius: var(--box-margin);
	}

	.settings-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--box-margin);
	}

	.toggle-button {
		width: 100%;
	}

	ul:first-child {
		margin-top: var(--content-margin);
	}

	.locations-section {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	.location-instructions {
		background-color: var(--box-color-dark);
		border-radius: var(--box-margin);
		padding: var(--box-margin);
		padding-inline: var(--layout-margin);
		box-shadow: var(--box-shadow);
	}

	.instructions-title {
		margin-bottom: var(--box-margin);
	}

	.location-instructions li {
		opacity: 0.75;
	}

	textarea {
		padding: var(--layout-margin);
		min-height: 100%;
		width: 100%;
	}

	.text-area-box {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		overflow: hidden;
		min-height: 200px;
		flex-grow: 1;
	}

	.submit-area {
		margin-top: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
		border-radius: var(--layout-margin);
	}

	.submit-area button {
		padding-inline: 30px;
	}

	/* Popup styles */
	.text-header-left {
		margin-bottom: var(--layout-margin);
	}

	.spacer {
		height: 20px;
		width: 100%;
	}

	.link-box {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
		padding: var(--box-margin);
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
	}

	.link-box p {
		flex-grow: 1;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		margin-inline: var(--content-margin);
	}

	.link-box-margin {
		margin-bottom: var(--box-margin);
	}

	@media (max-width: 1300px) {
		.form-layout {
			grid-template-columns: 1fr;
		}

		.settings-grid {
			grid-template-columns: 1fr;
		}

		.locations-column {
			order: 1;
		}
	}
</style>
