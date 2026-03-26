<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { badgePopup } from "$lib/stores/uiStore";
	import { ArrowRight } from "@lucide/svelte";
	import {
		profileData,
		profileExperience,
		profileSupporterLevel,
		profileId,
	} from "$lib/stores/context-specific/profileStore";
	import Badge from "./Badge.svelte";
</script>

<Popup z={971} slim={true} bind:open={$badgePopup}>
	<div class="popup-title">
		<h1 id="badgePopupHeader">Badges</h1>
	</div>
	<div class="spacerBadge"></div>
	<div class="badgeLabel">
		<p>For experience gained</p>
		<p id="experienceBadgeStatus" class="unlockBadgeStatus">
			50,000 <ArrowRight size="13" /> 250,000 <ArrowRight size="13" /> 1M <ArrowRight size="13" /> 10M
		</p>
	</div>
	<div class="badgeBox">
		<Badge id="expBadge1" interactive={true} unlocked={$profileExperience >= 50000} />
		<Badge id="expBadge2" interactive={true} unlocked={$profileExperience >= 250000} />
		<Badge id="expBadge3" interactive={true} unlocked={$profileExperience >= 1000000} />
		<Badge id="expBadge4" interactive={true} unlocked={$profileExperience >= 10000000} />
	</div>
	<div class="badgeLabel">
		<p>For duels won</p>
		<p id="duelsBadgeStatus" class="unlockBadgeStatus">
			5 <ArrowRight size="13" /> 50 <ArrowRight size="13" /> 100 <ArrowRight size="13" /> 500
		</p>
	</div>
	<div class="badgeBox">
		<Badge id="duelBadge1" interactive={true} unlocked={$profileData?.duelsWon >= 5} />
		<Badge id="duelBadge2" interactive={true} unlocked={$profileData?.duelsWon >= 50} />
		<Badge id="duelBadge3" interactive={true} unlocked={$profileData?.duelsWon >= 100} />
		<Badge id="duelBadge4" interactive={true} unlocked={$profileData?.duelsWon >= 500} />
	</div>
	<div class="badgeLabel">
		<p>For competitions entered</p>
		<p id="competitionsBadgeStatus" class="unlockBadgeStatus">
			10 <ArrowRight size="13" /> 50 <ArrowRight size="13" /> 100 <ArrowRight size="13" /> 500
		</p>
	</div>
	<div class="badgeBox">
		<Badge id="compBadge1" interactive={true} unlocked={$profileData?.competitionsEntered >= 10} />
		<Badge id="compBadge2" interactive={true} unlocked={$profileData?.competitionsEntered >= 50} />
		<Badge id="compBadge3" interactive={true} unlocked={$profileData?.competitionsEntered >= 100} />
		<Badge id="compBadge4" interactive={true} unlocked={$profileData?.competitionsEntered >= 500} />
	</div>
	<div class="badgeLabel">
		<p>For streaks finished</p>
		<p id="streakBadgeStatus" class="unlockBadgeStatus">
			5 <ArrowRight size="13" /> 15 <ArrowRight size="13" /> 50 <ArrowRight size="13" /> 100
		</p>
	</div>
	<div class="badgeBox">
		<Badge id="streakBadge1" interactive={true} unlocked={$profileData?.highestCountryStreak >= 5} />
		<Badge id="streakBadge2" interactive={true} unlocked={$profileData?.highestCountryStreak >= 15} />
		<Badge id="streakBadge3" interactive={true} unlocked={$profileData?.highestCountryStreak >= 50} />
		<Badge id="streakBadge4" interactive={true} unlocked={$profileData?.highestCountryStreak >= 100} />
	</div>
	<div class="badgeLabel">
		<p>For supporter tiers</p>
		<p id="supporterBadgeStatus" class="unlockBadgeStatus">
			1 <ArrowRight size="13" /> 2 <ArrowRight size="13" /> 3
		</p>
	</div>
	<div class="badgeBox">
		<Badge id="supporterBadge1" interactive={true} unlocked={$profileSupporterLevel >= 1} />
		<Badge id="supporterBadge2" interactive={true} unlocked={$profileSupporterLevel >= 2} />
		<Badge id="supporterBadge3" interactive={true} unlocked={$profileSupporterLevel >= 3} />
	</div>
	<div class="badgeLabel">
		<p>Miscellaneous</p>
	</div>
	<div class="badgeBox" style="margin-bottom: var(--content-margin)">
		<Badge id="miscBadge1" interactive={true} unlocked={$profileId <= 5} />
	</div>
</Popup>

<style>
	.spacerBadge {
		height: var(--content-margin);
	}

	.badgeLabel {
		padding: 3px;
		background-color: var(--box-color);
		border-radius: var(--box-margin);
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		text-align: left;
		padding-left: var(--box-margin);
		display: flex;
		box-shadow: var(--box-shadow);
		justify-content: space-between;
		flex-wrap: wrap;
	}

	.badgeBox {
		background-color: var(--box-color-dark);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding: var(--box-margin);
		width: 100%;
		box-sizing: border-box;
		flex-wrap: wrap;
		gap: var(--box-margin);
		margin-bottom: var(--layout-margin);
	}

	.unlockBadgeStatus {
		background-color: rgba(0, 0, 0, 0.1);
		padding: 3px;
		padding-inline: 7px;
		border-radius: var(--panel-margin);
		font-size: 20px;
		color: rgba(255, 255, 255, 0.75);
	}
</style>
