<script>
  import Popup from "$lib/components/Popup.svelte";
  import { playSound } from "$lib/utils/soundManager";
  import { badgePopup } from "$lib/stores/uiStore";
</script>

{#if $badgePopup}
  <Popup z="971" slim="true">
    <div class="popup-title">
      <h1 id="badgePopupHeader">Badges</h1>
    </div>
    <div id="badgeContainer" class="badgeContainer">
      <div class="spacerBadge"></div>
      <div class="badgeLabel">
        <p>For Experience:</p>
        <p id="experienceBadgeStatus" class="unlockBadgeStatus">Unlock next at x XP</p>
      </div>
      <div class="badgeBox">
        <p id="expBadge1" class="badge badgeStage1">New Explorer</p>
        <p id="expBadge2" class="badge badgeStage2">Skilled Adventurer</p>
        <p id="expBadge3" class="badge badgeStage3">Experienced Veteran</p>
        <p id="expBadge4" class="badge badgeStage4">Master of Experience</p>
      </div>
      <div class="badgeLabel">
        <p>For Duels:</p>
        <p id="duelsBadgeStatus" class="unlockBadgeStatus">Unlock next at x Wins</p>
      </div>
      <div class="badgeBox">
        <p id="duelBadge1" class="badge badgeStage1">Casual Duelist</p>
        <p id="duelBadge2" class="badge badgeStage2">Proven Combatant</p>
        <p id="duelBadge3" class="badge badgeStage3">Expert Duelist</p>
        <p id="duelBadge4" class="badge badgeStage4">Duel Master</p>
      </div>
      <div class="badgeLabel">
        <p>For Competitions:</p>
        <p id="competitionsBadgeStatus" class="unlockBadgeStatus">Unlock next at x Entries</p>
      </div>
      <div class="badgeBox">
        <p id="compBadge1" class="badge badgeStage1">Rookie Competitor</p>
        <p id="compBadge2" class="badge badgeStage2">Dedicated Entrant</p>
        <p id="compBadge3" class="badge badgeStage3">Seasoned Contender</p>
        <p id="compBadge4" class="badge badgeStage4">Top Champion</p>
      </div>
      <div class="badgeLabel">
        <p>For Streaks:</p>
        <p id="streakBadgeStatus" class="unlockBadgeStatus">Unlock next at x Streak</p>
      </div>
      <div class="badgeBox">
        <p id="streakBadge1" class="badge badgeStage1">Streak Starter</p>
        <p id="streakBadge2" class="badge badgeStage2">Consistent Performer</p>
        <p id="streakBadge3" class="badge badgeStage3">Streak Specialist</p>
        <p id="streakBadge4" class="badge badgeStage4">Ultimate Streaker</p>
      </div>
      <div class="badgeLabel">
        <p>For Supporters:</p>
        <p id="supporterBadgeStatus" class="unlockBadgeStatus">Become a supporter (coming soon)</p>
      </div>
      <div class="badgeBox">
        <p id="supporterBadge1" class="badge badgeStageSupporter1">New Supporter</p>
        <p id="supporterBadge2" class="badge badgeStageSupporter2">Kind Contributor</p>
        <p id="supporterBadge3" class="badge badgeStageSupporter3">Generous Benefactor</p>
        <p id="supporterBadge4" class="badge badgeStageSupporter4">Ultimate Patron</p>
      </div>
      <div class="badgeLabel">
        <p>Miscellaneous:</p>
      </div>
      <div class="badgeBox" style="margin-bottom: 5px">
        <p id="miscBadge1" class="badge badgeStageDeveloper">Developer</p>
      </div>
    </div>
    <button id="badgeClose" class="standardButton white closeButton">Close</button>
  </Popup>
{/if}

<style>
</style>
