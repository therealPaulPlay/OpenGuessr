<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { checkIfFriendsWithId } from "$lib/utils/checkIfFriendsWithId";
	import SupporterPitch from "$lib/components/SupporterPitch.svelte";
	import { singleplayer } from "$lib/stores/modeStore";
	import { isAuthenticated } from "$lib/stores/accountStore";
	import { sendFriendRequest } from "$lib/utils/sendFriendRequest";
	import { experienceCalculations } from "$lib/utils/experienceCalculations";
	import { formatDateTime } from "$lib/utils/formatJoinedDate";
	import { updateProfileUsername } from "$lib/utils/updateUsername";
	import { submitAccountDeletion } from "$lib/utils/deleteAccount";
	import { confirmPasswordValue, confirmUsernameValue } from "$lib/stores/context-specific/confirmPopupStore";
	import { showConfirmPopup } from "$lib/utils/confirmPopup";
	import { filterProfanity } from "$lib/utils/profanityCheck";
	import { saveProfileAboutIfChanges } from "$lib/utils/updateProfileData";
	import { resetLocalSave, checkAuthenticationStatus } from "$lib/logic/accountLogic";
	import { pinPopup, badgePopup, reportPopup } from "$lib/stores/uiStore";
	import * as FlagIcons from "svelte-flag-icons";
	import { flagPickerPopup } from "$lib/stores/uiStore";
	import { Flame, Plus, PlusCircle, Skull, SquarePlus } from "lucide-svelte";
	import Badge from "$lib/components/Badge.svelte";
	import { crazyGames } from "$lib/stores/context-specific/platformSettingsStore";
	import {
		profileData,
		profileExperience,
		profileId,
		profileSupporterLevel,
		unsavedAboutChanges,
	} from "$lib/stores/context-specific/profileStore";
	import { profilePopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import {
		Edit,
		Trash2,
		TriangleAlert,
		Pencil,
		Award,
		Swords,
		TrendingUp,
		Medal,
		Calendar,
		User,
		Shield,
		BarChart3,
		Trophy,
		Crown,
	} from "lucide-svelte";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { loadProfileFromId } from "$lib/utils/loadProfile";
	import { reportUserId } from "$lib/stores/context-specific/reportPopupStore";
	import { scale } from "svelte/transition";
	import Tabs from "./ui/Tabs.svelte";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
	import { errorPopup } from "$lib/utils/errorHandling";

	let textarea = $state();
	let isFriendsWithId = $state(true);
	let selectedTabIndex = $state(0);

	profilePopup.subscribe(async (value) => {
		if (value == true) {
			isFriendsWithId = true;
			isFriendsWithId = await checkIfFriendsWithId($profileId);
		}
	});

	let filteredAbout = $state("");

	$effect(async () => {
		filteredAbout = "";
		if ($profileData?.about) filteredAbout = await filterProfanity($profileData?.about);
	});

	onMount(() => {
		const profileFromURL = $page.url.searchParams.get("profile-id");
		if (profileFromURL != null) loadProfileFromId(profileFromURL, true);
	});

	let ProfileFlag = $derived(FlagIcons[$profileData?.flag] || undefined);

	// Define stat categories with their icons and display data
	const statCategories = [
		{
			name: "XP",
			cards: [
				{
					title: "Level",
					getValue: () => experienceCalculations($profileExperience)?.level,
					icon: Award,
				},
				{
					title: "Total XP",
					getValue: () => $profileExperience?.toLocaleString() + " XP",
					icon: BarChart3,
				},
				{
					title: "Until level-up",
					getValue: () => experienceCalculations($profileExperience)?.requiredForLevelUpgrade?.toLocaleString() + " XP",
					icon: TrendingUp,
				},
			],
		},
		{
			name: "Duels",
			cards: [
				{
					title: "Duels lost",
					getValue: () => $profileData?.duelsLost?.toLocaleString() || "0",
					icon: Skull,
				},
				{
					title: "Duels won",
					getValue: () => $profileData?.duelsWon?.toLocaleString() || "0",
					icon: Trophy,
				},
				{
					title: "Win streak",
					getValue: () => $profileData?.currentDuelWinStreak?.toLocaleString() || "0",
					icon: Flame,
				},
				{
					title: "Elo rating",
					getValue: () => $profileData?.elo,
					icon: Crown,
				},
			],
		},
		{
			name: "Misc.",
			cards: [
				{
					title: "Competitions entered",
					getValue: () => $profileData?.competitionsEntered?.toLocaleString() || "0",
					icon: Medal,
				},
				{
					title: "Highest country streak",
					getValue: () => $profileData?.highestCountryStreak?.toLocaleString() || "0",
					icon: Flame,
				},
			],
		},
		{
			name: "Info",
			cards: [
				{
					title: "User ID",
					getValue: () => "user-" + $profileId,
					icon: User,
				},
				{
					title: "Joined date",
					getValue: () => formatDateTime($profileData?.joinedDate),
					icon: Calendar,
				},
			],
		},
	];
</script>

{#if $profilePopup}
	<Popup z={970} slim={true}>
		<div class="popup-title">
			<div class="profileNameArea">
				<div id="profileViewName">
					<h1>{$profileData.username}</h1>
					<!-- Profile Flag -->
					{#if $profileData?.flag && FlagIcons[$profileData.flag]}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<span
							class="flag-container"
							tabindex="0"
							role="button"
							onclick={() => flagPickerPopup.set(true)}
							class:profileFlagNotInteractive={$profileId != localStorage.getItem("id")}
						>
							<ProfileFlag />
						</span>
					{:else if $profileId == localStorage.getItem("id")}
						<button class="flag-container addFlagButton" onclick={() => flagPickerPopup.set(true)}>
							<SquarePlus size={20} strokeWidth={2.25} />
						</button>
					{/if}
				</div>
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div id="profileNameBox">
					{#if $profileId == localStorage.getItem("id") && !$profileData?.badge}
						<button
							id="badgeButton"
							class="standardButton"
							onclick={() => {
								playSound("basic_button");
								badgePopup.set(true);
							}}>+ Badge</button
						>
					{/if}
					{#if $profileData?.badge}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							id="badgeArea"
							role="button"
							tabindex="0"
							style:pointer-events={$profileId == localStorage.getItem("id") ? "auto" : "none"}
							onclick={() => {
								playSound("basic_button");
								badgePopup.set(true);
							}}
						>
							<Badge id={$profileData?.badge} interactive={false} display="true" />
						</div>
					{/if}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="profilePinArea standardButton white"
						class:pinDisplayOnly={$profileId != localStorage.getItem("id")}
						role="button"
						tabindex="0"
						style:pointer-events={$profileId == localStorage.getItem("id") ? "auto" : "none"}
						onclick={() => {
							playSound("basic_button");
							pinPopup.set(true);
						}}
					>
						<img id="selectedProfilePin" alt="pin" src={`/img/pins/player_pin${Number($profileData?.pin) || 0}.png`} />
						{#if $profileId == localStorage.getItem("id")}
							<Pencil
								style="opacity: 0.75; margin-bottom: 5px; margin-right: 5px; margin-left: 2px;"
								size={17}
								strokeWidth={2.75}
							/>
						{/if}
					</div>
					{#if $profileSupporterLevel >= 1}
						<div id="supporterTag">
							<p id="supporterTagText">Tier {$profileSupporterLevel}</p>
							<img id="supporterIcon" alt="supporter tag" src="/img/supporter_icon.png" />
						</div>
					{/if}
					{#if $profileId != localStorage.getItem("id")}
						<button
							class="standardButton white"
							id="profileReportButton"
							onclick={(e) => {
								playSound("basic_button");
								reportUserId.set($profileId);
								reportPopup.set(true);
							}}
						>
							Report <TriangleAlert size={20} strokeWidth={2.5} style="margin-bottom: -2px; margin-left: 2px;" />
						</button>
					{/if}
					{#if $profileId != localStorage.getItem("id") && $isAuthenticated && !isFriendsWithId}
						<button
							class="standardButton white"
							transition:scale
							id="profileAddFriend"
							onclick={(e) => {
								playSound("basic_button");
								sendFriendRequest($profileId, e.target); // This also shows a notification
							}}
						>
							<img src="/img/add_friend_icon.png" alt="send friend request" id="addFriendIcon" />
						</button>
					{/if}
				</div>
			</div>
		</div>
		<div id="profileScrollSection">
			{#if $profileId == localStorage.getItem("id") && !$crazyGames}
				<SupporterPitch />
			{/if}

			{#if $profileId == localStorage.getItem("id") || $profileData?.about}
				<textarea
					id="profileAbout"
					readonly={$profileId != localStorage.getItem("id")}
					maxlength="150"
					spellcheck="false"
					value={filteredAbout}
					bind:this={textarea}
					placeholder="Share a few facts about yourself with others..."
					oninput={() => {
						if (!$unsavedAboutChanges) unsavedAboutChanges.set(true);
					}}
					onkeypress={(e) => {
						if (e.key == "Enter") e.preventDefault();
					}}
				></textarea>
			{/if}

			<!-- Stats Carousel Section -->
			<TitleSeparator text="Statistics" />
			<div class="stat-switch">
				<Tabs
					tabs={statCategories.map((cat) => cat.name)}
					selected={statCategories[selectedTabIndex].name}
					bind:selectedIndex={selectedTabIndex}
					class="stat-tabs-grow"
					onchange={() => playSound("basic_button")}
				/>
			</div>
			<div class="stats-container">
				<div class="stats-carousel" style="transform: translateX(calc(-{selectedTabIndex} * 100%));">
					{#each statCategories as category, catIndex}
						<div class="carousel-slide" class:active={selectedTabIndex === catIndex}>
							{#each category.cards as card}
								<div class="stat-card">
									<div class="card-icon">
										<card.icon size={24} strokeWidth={2} />
									</div>
									<div class="card-content">
										<div>{card.title}</div>
										<p>{card.getValue()}</p>
									</div>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>

			{#if $profileId == localStorage.getItem("id")}
				<TitleSeparator text="Management" />
				<div class="managementBox">
					<div class="editNameSection">
						<button
							class="standardButton white"
							id="editUsername"
							onclick={() => {
								playSound("basic_button");
								showConfirmPopup(
									"Update username",
									"Input your new name into the box and click confirm.",
									() => {
										if ($confirmUsernameValue) updateProfileUsername($confirmUsernameValue);
										else errorPopup("New username is invalid", "Please specify a valid new username.");
									},
									false,
									true,
								);
							}}
						>
							<Edit size={20} style="margin-bottom: -2px;" />
							Name
						</button>
					</div>
					<button
						id="accountDeleteButton"
						class="standardButton white"
						class:buttonDisabled={$crazyGames}
						onclick={() => {
							playSound("basic_button");
							showConfirmPopup(
								"Delete account",
								"Please make sure to delete user-created content before proceeding, if you wish to remove that from the platform.",
								() => {
									if ($confirmPasswordValue) submitAccountDeletion($confirmPasswordValue);
									else errorPopup("Password required", "Your password is required for deleting your account.");
								},
								true,
							);
						}}
					>
						<Trash2 size={20} style="margin-bottom: -1px;" />
						Delete</button
					>
					<button
						id="profileSignoutButton"
						class="standardButton white"
						class:buttonDisabled={$crazyGames || !$singleplayer}
						onclick={() => {
							playSound("basic_button");
							resetLocalSave();
							checkAuthenticationStatus();
							profilePopup.set(false);
						}}
					>
						<img class="logoutImage" src="/img/signout.png" alt="Log out." />
					</button>
				</div>
			{/if}
		</div>
		<button
			id="profileClose"
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				if ($profileId == localStorage.getItem("id")) saveProfileAboutIfChanges(textarea?.value?.trim());
				profilePopup.set(false);
			}}>Close</button
		>
	</Popup>
{/if}

<div style="display: none;">
	<!-- Ensure the component is always mounted, for the URL load to work -->
</div>

<style>
	.profileNameArea {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		overflow: hidden;
		margin-bottom: 20px;
		background-color: var(--box-color-dark);
		padding: var(--layout-margin);
		width: calc(100% + 20px);
		margin-left: -25px;
		margin-top: -25px;
		gap: var(--box-margin);
	}

	.buttonDisabled {
		pointer-events: none;
		opacity: 0.5;
	}

	#badgeArea {
		cursor: pointer;
		transition: scale 250ms ease;
	}

	#badgeArea:hover {
		scale: 0.98;
	}

	.flag-container {
		display: inline-flex;
		align-items: center;
		width: 25px;
		margin-top: 8px;
		cursor: pointer;
	}

	.profileFlagNotInteractive {
		pointer-events: none;
	}

	.addFlagButton {
		transition: opacity 250ms ease;
		opacity: 0.75;
		width: 22px;
	}

	.addFlagButton:hover {
		opacity: 1;
	}

	:global(.flag-container svg) {
		height: 100%;
		width: auto;
	}

	#badgeButton {
		background: linear-gradient(0.6turn, rgb(144, 147, 151), #646575);
		color: white;
		border: none;
		padding-inline: 12px;
		font-size: 20px;
		padding-top: 0px;
		padding-bottom: 0px;
		box-sizing: border-box;
	}

	#profileViewName {
		overflow: hidden;
		text-wrap: nowrap;
		margin-left: 10px;
		margin-right: 20px;
		display: inline-flex;
		justify-content: center;
		gap: 8px;
	}

	#profileSignoutButton {
		max-width: 60px;
		flex-grow: 1;
	}

	#profileViewName h1 {
		text-overflow: ellipsis;
		overflow: hidden;
	}

	#profileNameBox {
		display: flex;
		align-items: center;
		gap: var(--layout-margin);
		flex-wrap: wrap;
		padding-inline: var(--box-margin);
	}

	.logoutImage {
		width: 22px;
		height: 22px;
		vertical-align: -3px;
		margin-right: -3px;
	}

	#supporterTag {
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 5px;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 40px;
		padding-inline: var(--panel-margin);
	}

	#supporterTag p {
		font-size: 18px;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 0;
		transition: max-width 350ms ease-in-out;
		transition-delay: 100ms;
		width: 45px;
		text-align: center;
		text-wrap: nowrap;
	}

	#supporterTag:hover p {
		max-width: 120px;
	}

	.profilePinArea {
		padding-inline: 5px;
	}

	.pinDisplayOnly {
		border: none;
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: none;
		display: flex;
		align-items: center;
	}

	#selectedProfilePin {
		width: 28px;
		height: 28px;
	}

	#supporterIcon {
		width: 25px;
		height: 25px;
		filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.25));
	}

	#profileAbout {
		resize: none;
		width: calc(100% - 30px);
		height: 55px;
		transition: background-color 250ms ease;
		color: white;
		padding: 15px;
		margin-bottom: var(--layout-margin);
		scrollbar-width: none;
	}

	#profileAddFriend {
		padding: 5px;
		font-size: 20px;
	}

	#profileReportButton {
		padding: 5px;
		padding-inline: 8px;
		font-size: 20px;
	}

	#profileScrollSection {
		overflow-x: hidden;
		overflow-y: auto;
		max-height: calc(100dvh - 350px);
		width: 100%;
	}

	:global(.stat-switch) {
		margin-top: 8px;
		border-radius: 10px;
		max-width: 100%;
		box-sizing: border-box;
		background-color: var(--box-color);
		padding: var(--box-margin);
		display: flex;
	}

	:global(.stat-tabs-grow) {
		flex-grow: 1;
	}

	.stats-carousel {
		position: relative;
		width: 100%;
		display: flex;
		transition: transform 250ms ease;
	}

	.stats-container {
		border-radius: 10px;
		padding: var(--layout-margin) 0 10px 0;
		margin-bottom: var(--layout-margin);
	}

	.carousel-slide {
		min-width: 100%;
		box-sizing: border-box;
		display: flex;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		justify-content: center;
		overflow: hidden;
	}

	.stat-card {
		background-color: var(--box-color);
		border-radius: 10px;
		padding: 5px;
		min-width: 150px;
		display: flex;
		flex: 1;
		align-items: center;
		gap: 15px;
		transition: transform 250ms ease;
	}

	.card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 100%;
		margin-left: 8px;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.card-content {
		flex-grow: 1;
		overflow: hidden;
	}

	.card-content div {
		opacity: 0.5;
		font-size: 18px;
		text-wrap: nowrap;
	}
	.card-content p {
		margin-bottom: 5px;
		max-width: 150px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.managementBox {
		border-radius: 10px;
		background-color: var(--box-color);
		display: flex;
		justify-content: flex-start;
		max-height: 300px;
		overflow-x: hidden;
		overflow-y: auto;
		padding: var(--box-margin);
		gap: var(--box-margin);
		align-items: center;
		flex-wrap: wrap;
	}

	.editNameSection {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 5px;
	}

	#addFriendIcon {
		width: 22px;
		height: 22px;
		vertical-align: -3px;
		padding-left: 4px;
		pointer-events: none;
	}

	@media all and (max-width: 1200px) {
		#profileViewName {
			font-size: 32px;
		}
	}

	@media all and (max-width: 800px) {
		#profileAbout {
			height: 85px;
		}

		.flag-container {
			height: 18px;
			width: 18px;
			margin-top: 15px;
		}
	}
</style>
