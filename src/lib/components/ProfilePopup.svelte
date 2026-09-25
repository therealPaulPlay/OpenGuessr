<script>
	import Popup from "$lib/components/ui/Popup.svelte";
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
	import { saveProfileAboutIfChanges } from "$lib/utils/updateProfileData";
	import { signOut } from "$lib/logic/accountLogic";
	import { pinPopup, badgePopup, reportPopup, divisionMatchHistoryPopup } from "$lib/stores/uiStore";
	import { openDirectMessageWith } from "$lib/logic/headlessChatLogic";
	import { flagPickerPopup } from "$lib/stores/uiStore";
	import {
		Flame,
		Link,
		Skull,
		SquarePlus,
		Edit,
		Trash2,
		TriangleAlert,
		Pencil,
		Award,
		TrendingUp,
		Medal,
		Calendar,
		User,
		BarChart3,
		Trophy,
		Crown,
		ArrowUpFromDot,
		UserRoundPlus,
		UserRoundCheck,
		MessageSquare,
		History,
	} from "@lucide/svelte";
	import Badge from "$lib/components/Badge.svelte";
	import { crazyGames, y8Games, playgama } from "$lib/stores/context-specific/platformSettingsStore";
	import { profileData, profileId, unsavedAboutChanges } from "$lib/stores/context-specific/profileStore";
	import { profilePopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { page } from "$app/state";
	import { showProfile } from "$lib/utils/showProfile";
	import Tabs from "./ui/Tabs.svelte";
	import TitleSeparator from "./ui/TitleSeparator.svelte";
	import { showNotification } from "$lib/utils/notifications";
	import { censor } from "fast-profanity-filter";
	import { tooltip } from "$lib/utils/tooltip.svelte";
	import { signupPrompt } from "$lib/utils/signupPrompt";
	import Flag from "./Flag.svelte";
	import { blur, slide } from "svelte/transition";
	import { historyForUserId } from "$lib/stores/context-specific/divisionMatchHistoryStore";

	let textarea = $state();
	let selectedTabIndex = $state(0);

	let filteredAbout = $state("");

	$effect(() => {
		filteredAbout = "";
		if ($profileData?.about) filteredAbout = censor($profileData?.about);
	});

	$effect(() => {
		const profileFromURL = page.url.searchParams.get("profile-id");
		if (profileFromURL == null) return;

		showProfile(profileFromURL);
		history.replaceState({}, document.title, window.location.pathname);
	});

	// Reset statistics tab selection when closed
	profilePopup.subscribe((value) => {
		if (!value) selectedTabIndex = 0;
	});

	// Define stat categories with their icons and display data
	const statCategories = [
		{
			name: "XP",
			cards: [
				{
					title: "Level",
					getValue: () => experienceCalculations($profileData?.experience)?.level,
					icon: Award,
				},
				{
					title: "Total XP",
					getValue: () => $profileData?.experience?.toLocaleString(),
					icon: BarChart3,
				},
				{
					title: "XP until level-up",
					getValue: () => experienceCalculations($profileData?.experience)?.requiredForLevelUpgrade?.toLocaleString(),
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
					getValue: () => $profileData?.elo?.toLocaleString(),
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
				{
					title: "Highest elo",
					getValue: () => $profileData?.highestElo?.toLocaleString() || "1000",
					icon: ArrowUpFromDot,
				},
			],
		},
		{
			name: "About",
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

<Popup
	slim={true}
	bind:open={$profilePopup}
	onUserClose={() => {
		if ($profileId == localStorage.getItem("id")) saveProfileAboutIfChanges(textarea?.value?.trim());
	}}
>
	<div class="profile-name-area">
		<div class="profile-view-name">
			<h1>{$profileData?.username}</h1>
			<!-- Profile Flag -->
			{#if $profileData?.flag}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<span
					class="flag-container"
					style:cursor={$profileId == localStorage.getItem("id") ? "pointer" : undefined}
					tabindex="0"
					role="button"
					onclick={() => {
						if ($profileId == localStorage.getItem("id")) flagPickerPopup.set(true);
					}}
				>
					<Flag code={$profileData?.flag} />
				</span>
			{:else if $profileId == localStorage.getItem("id")}
				<button class="flag-container add-flag-button" onclick={() => flagPickerPopup.set(true)}>
					<SquarePlus size={20} strokeWidth={2} />
				</button>
			{/if}
		</div>
	</div>
	<div class="profile-name-box">
		<div class="profile-name-box-content of-left of-right">
			{#if $profileId == localStorage.getItem("id") && !$profileData?.badge}
				<button
					id="badge-button"
					class="standard-button"
					onclick={() => {
						playSound("basic_button");
						badgePopup.set(true);
					}}>+ Badge</button
				>
			{/if}
			{#if $profileData?.badge}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					id="badge-area"
					role="button"
					tabindex="0"
					style:pointer-events={$profileId == localStorage.getItem("id") ? "auto" : "none"}
					onclick={() => {
						playSound("basic_button");
						badgePopup.set(true);
					}}
				>
					<Badge id={$profileData?.badge} interactive={false} display={true} />
				</div>
			{/if}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="profile-pin-area standard-button white"
				class:pin-display-only={$profileId != localStorage.getItem("id")}
				role="button"
				tabindex="0"
				style:pointer-events={$profileId == localStorage.getItem("id") ? "auto" : "none"}
				onclick={() => {
					playSound("basic_button");
					pinPopup.set(true);
				}}
			>
				<img id="selected-profile-pin" alt="pin" src={`/img/pins/player_pin${$profileData?.pin ?? 0}.png`} />
				{#if $profileId == localStorage.getItem("id")}
					<Pencil
						style="opacity: 0.75; margin-right: var(--content-margin); margin-left: 2px;"
						size={17}
						strokeWidth={2.25}
					/>
				{/if}
			</div>
			{#if $profileId == localStorage.getItem("id")}
				<button
					class="standard-button white"
					{@attach tooltip({ text: "Share link" })}
					onclick={() => {
						playSound("basic_button");
						navigator.clipboard
							.writeText(page.url.origin + "?profile-id=" + $profileId)
							.then(function () {
								showNotification("Copied!");
							})
							.catch(function (error) {
								showNotification("Error: " + error);
							});
					}}
				>
					<Link strokeWidth={2} style="vertical-align: -2px;" size={20} />
				</button>
			{/if}
			{#if $profileData?.dailyCompetitionStreak >= 1}
				<div class="name-box-icon white-soft" {@attach tooltip({ text: "Daily Comp. streak" })}>
					<p>{$profileData?.dailyCompetitionStreak}</p>
					<img id="supporter-icon" alt="streak icon" src="/img/streak_icon.png" />
				</div>
			{/if}
			{#if $profileData?.supporterLevel >= 1}
				<div
					class="name-box-icon white-soft"
					{@attach tooltip({ text: "Supporter tier " + $profileData?.supporterLevel })}
				>
					<img id="supporter-icon" alt="supporter icon" src="/img/supporter_icon.png" />
				</div>
			{/if}
			{#if $profileId != localStorage.getItem("id")}
				<button
					class="standard-button white"
					onclick={() => {
						playSound("basic_button");
						reportPopup.set(true);
					}}
				>
					Report <TriangleAlert size={20} strokeWidth={2.25} style="margin-bottom: -2px; margin-left: 2px;" />
				</button>
			{/if}
			{#if $profileId != localStorage.getItem("id")}
				<button
					class="standard-button white"
					{@attach tooltip({ text: "Send message" })}
					onclick={() => {
						playSound("basic_button");
						if ($isAuthenticated) openDirectMessageWith($profileId);
						else signupPrompt();
					}}
				>
					<MessageSquare style="margin-bottom: -1px;" size={20} strokeWidth={2.25} />
				</button>
				<button
					class="standard-button white"
					disabled={$profileData?.areFriends}
					{@attach tooltip({ text: "Send friend request" })}
					onclick={() => {
						playSound("basic_button");
						if ($isAuthenticated) sendFriendRequest($profileId);
						else signupPrompt(() => sendFriendRequest($profileId));
					}}
				>
					{#if !$profileData?.areFriends}
						<UserRoundPlus style="margin-bottom: -1px; margin-left: 2px;" size={19} strokeWidth={2.25} />
					{:else}
						<UserRoundCheck style="margin-bottom: -1px; margin-left: 2px;" size={20} strokeWidth={2.25} />
					{/if}
				</button>
			{/if}
		</div>
	</div>
	{#if $profileId == localStorage.getItem("id")}
		<SupporterPitch />
	{/if}

	{#if $profileId == localStorage.getItem("id") || $profileData?.about}
		<div class="about-section">
			<textarea
				class="profile-about of-top of-bottom"
				readonly={$profileId != localStorage.getItem("id")}
				style:background-color={$profileId != localStorage.getItem("id") ? "transparent !important" : ""}
				maxlength="150"
				spellcheck="false"
				value={filteredAbout}
				bind:this={textarea}
				placeholder={$profileId == localStorage.getItem("id")
					? "Share a few facts about yourself with others..."
					: "Loading..."}
				oninput={() => {
					if (!$unsavedAboutChanges) unsavedAboutChanges.set(true);
				}}
				onkeypress={(e) => {
					if (e.key == "Enter") e.preventDefault();
				}}></textarea>
		</div>
	{/if}

	<!-- Stats section -->
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
	{#if selectedTabIndex != null}
		{const category = $derived(statCategories[selectedTabIndex])}
		{#snippet statCards(cards, animate)}
			{#each cards as card (card.title)}
				<div class="stat-card" in:blur={{ duration: animate ? 250 : 0 }}>
					<div class="card-icon white-soft">
						<card.icon size={24} strokeWidth={2} />
					</div>
					<div class="card-content">
						<div>{card.title}</div>
						<p>{card.getValue()}</p>
					</div>
				</div>
			{/each}
		{/snippet}
		<div class="stat-container">
			<!-- Hidden sizer with the most cards, so the box height stays stable across tabs -->
			<div class="stat-box stat-sizer">
				{@render statCards(statCategories.reduce((a, b) => (b.cards.length > a.cards.length ? b : a)).cards, false)}
			</div>
			<div class="stat-box">
				{@render statCards(category.cards, true)}
			</div>
		</div>
		{#if selectedTabIndex == 1 && $profileId != localStorage.getItem("id")}
			<div transition:slide={{ duration: 250 }} class="duel-history-box-container">
				<div class="duel-history-box" transition:blur|global={{ duration: 250 }}>
					<p style:padding-inline="var(--content-margin)" style:flex-grow="100">View player's duel history</p>
					<button
						class="standard-button white"
						style:flex-grow="1"
						onclick={() => {
							playSound("basic_button");
							if ($divisionMatchHistoryPopup) $profilePopup = false;
							$historyForUserId = $profileId;
							$divisionMatchHistoryPopup = true;
						}}>History <History size={20} strokeWidth={2.25} style="margin-bottom: -2px; margin-left: 2px;" /></button
					>
				</div>
			</div>
		{/if}
	{/if}

	{#if $profileId == localStorage.getItem("id")}
		<TitleSeparator text="Management" />
		<div class="management-box">
			<div class="management-box-content of-left of-right">
				<div class="edit-name-section">
					<button
						class="standard-button white"
						disabled={!$singleplayer}
						onclick={() => {
							playSound("basic_button");
							showConfirmPopup(
								"Update username",
								"Please input your new username. You can only change your username once per week.",
								() => {
									updateProfileUsername($confirmUsernameValue);
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
					class="standard-button white"
					disabled={!$singleplayer || $crazyGames || $y8Games || $playgama}
					onclick={() => {
						playSound("basic_button");
						showConfirmPopup(
							"Delete account",
							"Please input your password to confirm the account deletion.",
							() => {
								submitAccountDeletion($confirmPasswordValue);
							},
							true,
						);
					}}
				>
					<Trash2 size={20} style="margin-bottom: -1px;" />
					Account</button
				>
				<button
					class="standard-button white"
					disabled={!$singleplayer || $crazyGames || $playgama}
					onclick={() => {
						playSound("basic_button");
						signOut();
						profilePopup.set(false);
					}}
				>
					<img class="logout-image" src="/img/signout.png" alt="Log out." />
					Sign out
				</button>
			</div>
		</div>
	{/if}
</Popup>

<div style="display: none;">
	<!-- Ensure the component is always mounted, for the URL load to work -->
</div>

<style>
	.profile-name-area {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		overflow: hidden;
		padding: var(--layout-margin);
		width: calc(100% + 20px);
		margin-left: -25px;
		margin-top: -20px;
		gap: var(--box-margin);
	}

	#badge-area {
		cursor: pointer;
		transition: scale 250ms ease;
	}

	#badge-area:hover {
		scale: 0.98;
	}

	.duel-history-box {
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		box-sizing: border-box;
		width: 100%;
		background-color: var(--box-color);
		padding: var(--box-margin);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--box-margin);
		flex-wrap: wrap;
	}

	.duel-history-box-container {
		width: 100%;
		box-sizing: border-box;
		margin-top: var(--layout-margin);
	}

	.flag-container {
		display: inline-flex;
		align-items: center;
		width: 25px;
		padding-top: var(--panel-margin);
		height: fit-content;
		margin-top: auto;
		margin-bottom: auto;
	}

	.add-flag-button {
		transition: opacity 250ms ease;
		opacity: 0.75;
		width: 22px;
	}

	.add-flag-button:hover {
		opacity: 1;
	}

	:global(.flag-container svg) {
		height: 100%;
		width: auto;
	}

	#badge-button {
		background: linear-gradient(0.6turn, rgb(144, 147, 151), #646575);
		color: white;
		border: none;
		padding-inline: 12px;
		padding-top: 0px;
		padding-bottom: 0px;
		font-size: 20px;
		box-sizing: border-box;
	}

	.profile-view-name {
		overflow: hidden;
		text-wrap: nowrap;
		margin-left: var(--box-margin);
		margin-right: 65px;
		display: inline-flex;
		justify-content: center;
		gap: var(--panel-margin);
	}

	.profile-view-name h1 {
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.profile-name-box {
		margin-bottom: var(--layout-margin);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		max-width: fit-content;
	}

	.profile-name-box-content {
		display: flex;
		align-items: center;
		padding: var(--box-margin);
		gap: var(--box-margin);
		overflow-x: auto;
		scrollbar-width: none;
	}

	.logout-image {
		width: 22px;
		height: 22px;
		vertical-align: -3px;
		user-select: none;
		pointer-events: none;
	}

	.name-box-icon {
		box-shadow: var(--box-shadow);
		border-radius: var(--content-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		height: 40px;
		padding-inline: var(--panel-margin);
	}

	.name-box-icon p {
		padding-inline: var(--content-margin);
	}

	.profile-pin-area {
		padding-inline: var(--panel-margin);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--content-margin);
	}

	.pin-display-only {
		border: none;
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: var(--box-shadow);
		display: flex;
		align-items: center;
	}

	#selected-profile-pin {
		width: 30px;
		height: 30px;
	}

	#supporter-icon {
		width: 30px;
		height: 30px;
		filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.25));
		user-select: none;
		pointer-events: none;
	}

	.about-section {
		width: 100%;
		border-radius: var(--box-margin);
		margin-bottom: var(--layout-margin);
		transition: background-color 250ms ease;
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		box-sizing: border-box;
		overflow: hidden;
	}

	.profile-about {
		resize: none;
		width: 100%;
		min-height: 85px;
		color: white;
		padding: var(--layout-margin);
		scrollbar-width: none;
	}

	:global(.stat-switch) {
		margin-top: var(--panel-margin);
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		max-width: 100%;
		box-sizing: border-box;
		background-color: var(--box-color);
		padding: var(--box-margin);
		display: flex;
	}

	:global(.stat-tabs-grow) {
		flex-grow: 1;
	}

	.stat-container {
		margin-top: var(--layout-margin);
		min-width: 100%;
		box-sizing: border-box;
		display: grid;
	}

	.stat-box {
		grid-area: 1 / 1;
		display: flex;
		flex-wrap: wrap;
		gap: var(--layout-margin);
		justify-content: center;
		align-content: stretch;
	}

	.stat-sizer {
		visibility: hidden;
		pointer-events: none;
	}

	.stat-card {
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		padding: var(--content-margin);
		min-width: 150px;
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--layout-margin);
		transition: transform 250ms ease;
	}

	.card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 100%;
		margin-left: var(--panel-margin);
		box-shadow: var(--bulb-shadow);
		flex-shrink: 0;
	}

	.card-content {
		flex-grow: 1;
		overflow: hidden;
		padding-right: var(--content-margin);
	}

	.card-content div {
		opacity: 0.5;
		font-size: 18px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-content p {
		margin-bottom: var(--content-margin);
		max-width: 150px;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.management-box {
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		width: fit-content;
		max-width: 100%;
		padding: var(--box-margin);
		box-sizing: border-box;
	}

	.management-box-content {
		display: flex;
		justify-content: flex-start;
		overflow-y: auto;
		gap: var(--box-margin);
		align-items: center;
		scrollbar-width: none;
	}

	.edit-name-section {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--content-margin);
	}

	@media all and (max-width: 800px) {
		.about-section {
			max-height: 85px;
		}

		.flag-container {
			width: 18px;
		}
	}
</style>
