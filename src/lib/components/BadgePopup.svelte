<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { badgePopup } from "$lib/stores/uiStore";
	import { ArrowRight } from "lucide-svelte";
	import {
		profileData,
		profileExperience,
		profileSupporterLevel,
		profileId,
	} from "$lib/stores/context-specific/profileStore";
	import Badge from "./Badge.svelte";
</script>

{#if $badgePopup}
	<Popup z={971} slim={true}>
		<div class="popup-title">
			<h1 id="badgePopupHeader">Badges</h1>
		</div>
		<div id="badgeContainer" class="badgeContainer">
			<div class="spacerBadge"></div>
			<div class="badgeLabel">
				<p>For Experience gained:</p>
				<p id="experienceBadgeStatus" class="unlockBadgeStatus">
					50,000 <ArrowRight size="13" /> 250,000 <ArrowRight size="13" /> 1M <ArrowRight size="13" /> 10M
				</p>
			</div>
			<div class="badgeBox">
				<Badge id="expBadge1" interactive="true" unlocked={$profileExperience >= 50000} />
				<Badge id="expBadge2" interactive="true" unlocked={$profileExperience >= 250000} />
				<Badge id="expBadge3" interactive="true" unlocked={$profileExperience >= 1000000} />
				<Badge id="expBadge4" interactive="true" unlocked={$profileExperience >= 10000000} />
			</div>
			<div class="badgeLabel">
				<p>For Duels won:</p>
				<p id="duelsBadgeStatus" class="unlockBadgeStatus">
					5 <ArrowRight size="13" /> 50 <ArrowRight size="13" /> 100 <ArrowRight size="13" /> 500
				</p>
			</div>
			<div class="badgeBox">
				<Badge id="duelBadge1" interactive="true" unlocked={$profileData?.duelsWon >= 5} />
				<Badge id="duelBadge2" interactive="true" unlocked={$profileData?.duelsWon >= 50} />
				<Badge id="duelBadge3" interactive="true" unlocked={$profileData?.duelsWon >= 100} />
				<Badge id="duelBadge4" interactive="true" unlocked={$profileData?.duelsWon >= 500} />
			</div>
			<div class="badgeLabel">
				<p>For Competitions entered:</p>
				<p id="competitionsBadgeStatus" class="unlockBadgeStatus">
					10 <ArrowRight size="13" /> 50 <ArrowRight size="13" /> 100 <ArrowRight size="13" /> 500
				</p>
			</div>
			<div class="badgeBox">
				<Badge id="compBadge1" interactive="true" unlocked={$profileData?.competitionsPlayed >= 10} />
				<Badge id="compBadge2" interactive="true" unlocked={$profileData?.competitionsPlayed >= 50} />
				<Badge id="compBadge3" interactive="true" unlocked={$profileData?.competitionsPlayed >= 100} />
				<Badge id="compBadge4" interactive="true" unlocked={$profileData?.competitionsPlayed >= 500} />
			</div>
			<div class="badgeLabel">
				<p>For Streaks finished:</p>
				<p id="streakBadgeStatus" class="unlockBadgeStatus">
					5 <ArrowRight size="13" /> 15 <ArrowRight size="13" /> 50 <ArrowRight size="13" /> 100
				</p>
			</div>
			<div class="badgeBox">
				<Badge id="streakBadge1" interactive="true" unlocked={$profileData?.highestStreak >= 5} />
				<Badge id="streakBadge2" interactive="true" unlocked={$profileData?.highestStreak >= 15} />
				<Badge id="streakBadge3" interactive="true" unlocked={$profileData?.highestStreak >= 50} />
				<Badge id="streakBadge4" interactive="true" unlocked={$profileData?.highestStreak >= 100} />
			</div>
			<div class="badgeLabel">
				<p>For Supporter tiers:</p>
				<p id="supporterBadgeStatus" class="unlockBadgeStatus">
					1 <ArrowRight size="13" /> 2 <ArrowRight size="13" /> 3 <ArrowRight size="13" /> 4
				</p>
			</div>
			<div class="badgeBox">
				<Badge id="supporterBadge1" interactive="true" unlocked={$profileSupporterLevel >= 1} />
				<Badge id="supporterBadge2" interactive="true" unlocked={$profileSupporterLevel >= 2} />
				<Badge id="supporterBadge3" interactive="true" unlocked={$profileSupporterLevel >= 3} />
				<Badge id="supporterBadge4" interactive="true" unlocked={$profileSupporterLevel >= 4} />
			</div>
			<div class="badgeLabel">
				<p>Miscellaneous:</p>
			</div>
			<div class="badgeBox" style="margin-bottom: 5px">
				<Badge id="miscBadge1" interactive="true" unlocked={$profileId <= 5} />
			</div>
		</div>
		<button
			id="badgeClose"
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				badgePopup.set(false);
			}}>Close</button
		>
	</Popup>
{/if}

<style>
	.badgeContainer {
		width: 100%;
		max-height: calc(90dvh - 250px);
		overflow-x: hidden;
		overflow-y: auto;
	}

	.spacerBadge {
		height: 5px;
	}

	.badgeLabel {
		padding: 3px;
		background-color: var(--box-color);
		border-radius: 10px;
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		text-align: left;
		padding-left: 10px;
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
	}

	.badgeBox {
		background-color: var(--box-color-dark);
		border-radius: 10px;
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
		border-radius: 8px;
		font-size: 20px;
		color: rgba(255, 255, 255, 0.75);
	}
</style>
