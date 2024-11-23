<script>
  import Popup from "$lib/components/Popup.svelte";
  import { checkIfFriendsWithId } from "$lib/utils/checkIfFriendsWithId";
  import SupporterPitch from "$lib/components/SupporterPitch.svelte";
  import { isAuthenticated } from "$lib/stores/accountStore";
  import { sendFriendRequest } from "$lib/utils/sendFriendRequest";
  import { experienceCalculations } from "$lib/utils/experienceCalculations";
  import { formatDateTime } from "$lib/utils/formatJoinedDate";
  import { updateProfileUsername } from "$lib/utils/updateUsername";
  import { submitAccountDeletion } from "$lib/utils/deleteAccount";
  import { confirmPasswordValue, confirmUsernameValue } from "$lib/stores/context-specific/confirmPopupStore";
  import { showConfirmPopup } from "$lib/utils/confirmPopup";
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { saveProfileAboutIfYourProfileAndChanges } from "$lib/utils/updateProfileData";
  import { pinPopup, badgePopup } from "$lib/stores/uiStore";
  import Badge from "$lib/components/Badge.svelte";
  import {
    profileData,
    profileName,
    profileExperience,
    joinedDate,
    profileId,
    profileSupporterLevel,
    unsavedAboutChanges,
  } from "$lib/stores/context-specific/profileStore";
  import { profilePopup } from "$lib/stores/uiStore";
  import { playSound } from "$lib/utils/soundManager";
  import { Edit, Trash2 } from "lucide-svelte";
  import { onMount } from "svelte";

  let textarea = $state();

  // Load profile from link query
  function loadProfileFromURL() {
    try {
      let urlParams = new URLSearchParams(window.location.search);
      let profileFromLink = urlParams.get("profile");
      if (profileFromLink) {
        loadProfileFromId(profileFromLink, true);
        history.replaceState({}, document.title, window.location.pathname); // reset query in the address bar
      }
    } catch {}
  }

  onMount(() => {
    loadProfileFromURL();
  });
</script>

{#if $profilePopup}
  <Popup z="970">
    <div class="popup-title">
      <div class="profileNameArea">
        <h1 id="profileViewName">{$profileName}</h1>
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
          <img
            id="selectedProfilePin"
            alt="map pin"
            src={`/img/your_marker${$profileData?.pin || 0}.png`}
            style:pointer-events={$profileId == localStorage.getItem("id") ? "auto" : "none"}
            onclick={() => {
              playSound("basic_button");
              pinPopup.set(true);
            }}
          />
          {#if $profileSupporterLevel >= 1}
            <div id="supporterTag">
              <p id="supporterTagText">Tier {$profileSupporterLevel}</p>
              <img id="supporterIcon" alt="supporter tag" src="/img/supporter_icon.png" />
            </div>
          {/if}
          <p id="levelTextProfile">Lvl. {experienceCalculations($profileExperience)?.level}</p>
          {#if $profileId != localStorage.getItem("id") && $isAuthenticated && !checkIfFriendsWithId($profileId)}
            <button
              class="standardButton"
              id="profileAddFriend"
              onclick={(e) => {
                playSound("basic_button");
                sendFriendRequest(id, e.target);
              }}
            >
              <img src="/img/add_friend_icon.png" alt="send friend request" id="addFriendIcon" />
            </button>
          {/if}
        </div>
      </div>
    </div>
    {#if $profileId == localStorage.getItem("id")}
      <SupporterPitch />
    {/if}
    <div id="profileScrollSection">
      {#if $profileId == localStorage.getItem("id") || $profileData?.about}
        <textarea
          id="profileAbout"
          style:pointer-events={$profileId == localStorage.getItem("id") ? "auto" : "none"}
          maxlength="150"
          spellcheck="false"
          value={$profileData?.about}
          bind:this={textarea}
          placeholder="Share a few facts about yourself with others..."
          oninput={() => {
            if (!$unsavedAboutChanges) unsavedAboutChanges.set(true);
          }}
          onkeypress={(e) => {
            if (e.key == "Enter") {
              e.preventDefault();
            }
          }}
        ></textarea>
      {/if}
      <h3>User Stats:</h3>
      <div id="profileStats" class="statisticView">
        <div class="statisticsEnclosure">
          <p class="statsLabel">Experience:</p>
          <p id="statisticExperience">{$profileExperience?.toLocaleString()}</p>
        </div>
        <div class="statisticsEnclosure">
          <p class="statsLabel">Until Level-Up:</p>
          <p id="statisticUpgradeExperience">
            {experienceCalculations($profileExperience)?.requiredForLevelUpgrade?.toLocaleString()} XP
          </p>
        </div>
        <div class="statisticsEnclosure">
          <p class="statsLabel">Duels played:</p>
          <p id="statisticDuelsPlayed">{$profileData?.duelsPlayed?.toLocaleString() || 0}</p>
        </div>
        <div class="statisticsEnclosure">
          <p class="statsLabel">Duels won:</p>
          <p id="statisticDuelsWon">{$profileData?.duelsWon?.toLocaleString() || 0}</p>
        </div>
        <div class="statisticsEnclosure">
          <p class="statsLabel">Competitions entered:</p>
          <p id="statisticCompetitionsEntered">{$profileData?.competitionsPlayed?.toLocaleString() || 0}</p>
        </div>
        <div class="statisticsEnclosure">
          <p class="statsLabel">Highest ended Streak:</p>
          <p id="statisticHighestStreak">{$profileData?.highestStreak?.toLocaleString() || 0}</p>
        </div>
        <div class="statisticsEnclosure">
          <p class="statsLabel">Joined:</p>
          <p id="statisticJoinedDate">{formatDateTime($joinedDate)}</p>
        </div>
      </div>
      {#if $profileId == localStorage.getItem("id")}
        <h3 id="accountManagementHeader">Account Management:</h3>
        <div id="accountManagementArea" class="managementBox">
          <div class="editNameSection">
            <button
              class="standardButton white"
              id="editUsername"
              onclick={() => {
                playSound("basic_button");
                showConfirmPopup(
                  "Update your username",
                  "Input your new name into the box and click confirm.",
                  () => {
                    updateProfileUsername($confirmUsernameValue);
                  },
                  false,
                  true,
                );
              }}
            >
              <Edit size="16" />
              Name
            </button>
          </div>
          <button
            id="accountDeleteButton"
            class="standardButton white"
            onclick={() => {
              playSound("basic_button");
              showConfirmPopup(
                "Delete your account",
                "Please input your password to confirm the account deletion. Make sure to delete user-created content before proceeding, if you wish to remove that from the platform.",
                () => {
                  submitAccountDeletion($confirmPasswordValue);
                },
                true,
              );
            }}
          >
            <Trash2 size="16" />
            Delete Account</button
          >
        </div>
      {/if}
      <br />
    </div>
    <button
      id="profileClose"
      class="standardButton white closeButton"
      onclick={() => {
        playSound("basic_button");
        if (textarea) saveProfileAboutIfYourProfileAndChanges(textarea.value);
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
    background-color: rgba(30, 31, 44, 0.5);
    padding: 15px;
    padding-inline: 12px;
    width: calc(100% + 25px);
    margin-left: -25px;
    margin-top: -25px;
  }

  #badgeArea {
    cursor: pointer;
    transition: scale 250ms ease;
  }

  #badgeArea:hover {
    scale: 0.98;
  }

  #badgeButton {
    background: linear-gradient(0.6turn, rgb(144, 147, 151), #646575);
    color: white;
    border: none;
    padding-inline: 12px;
    margin: 0;
    font-size: 20px;
    padding-top: 0px;
    padding-bottom: 0px;
    box-sizing: border-box;
  }

  #profileStats {
    margin-top: 10px;
  }

  #profileViewName {
    text-overflow: ellipsis;
    overflow: hidden;
    text-wrap: nowrap;
    margin-left: 10px;
  }

  #profileNameBox {
    padding: 5px;
    margin-left: 5px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  #levelTextProfile {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 18px;
    border-radius: 5px;
    padding: 8px;
    text-align: center;
    min-width: 20px;
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: none;
  }

  #supporterTag {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 38px;
    padding-inline: 10px;
  }

  #supporterTag p {
    font-size: 18px;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
    transition: max-width 350ms ease-in-out;
    transition-delay: 100ms;
    width: 45px;
    text-wrap: nowrap;
  }

  #supporterTag:hover p {
    max-width: 100px;
  }

  #selectedProfilePin {
    width: 29px;
    height: 29px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    padding: 4.5px;
    cursor: pointer;
    transition: background-color 250ms ease;
  }

  #selectedProfilePin:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  #supporterIcon {
    width: 25px;
    height: 25px;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.25));
  }

  #profileAbout {
    resize: none;
    width: calc(100% - 30px);
    height: 65px;
    transition: background-color 250ms ease;
    color: white;
    padding: 15px;
    margin-top: 5px;
    margin-bottom: 10px;
    font-size: 25px;
  }

  #profileAbout:focus {
    background-color: rgba(255, 255, 255, 0.15);
  }

  #profileAddFriend {
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    padding: 5px;
    margin: 0;
    box-shadow: none;
    height: 100%;
    font-size: 23px;
    transition:
      filter 250ms ease,
      opacity 250ms ease,
      transform 150ms ease;
  }

  #profileScrollSection {
    overflow-x: hidden;
    overflow-y: auto;
    border-radius: 5px;
    max-height: calc(100dvh - 350px);
    min-height: 250px;
    scrollbar-width: none;
    transition: max-height 250ms ease-in-out;
  }

  .statisticView {
    border-radius: 10px;
    background-color: var(--box-color);
    display: flex;
    padding: 10px;
    margin-bottom: 10px;
    gap: 10px;
    flex-wrap: wrap;
    width: calc(100% - 20px);
    overflow: auto;
    height: fit-content;
  }

  .statsLabel {
    padding: 5px;
    padding-inline: 10px;
    width: fit-content;
    background-color: rgba(225, 255, 255, 0.1);
    border-radius: 5px;
    margin-right: 10px;
  }

  .statisticsEnclosure {
    display: flex;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    padding-right: 15px;
    align-items: center;
    font-size: 22px;
  }

  .managementBox {
    border-radius: 10px;
    background-color: var(--box-color);
    display: flex;
    justify-content: flex-start;
    max-height: 300px;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 10px;
    gap: 10px;
    margin-top: 10px;
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
    filter: invert();
    vertical-align: -3px;
    padding-left: 4px;
    pointer-events: none;
  }

  @media all and (max-width: 1200px) {
    #profileViewName {
      font-size: 32px;
    }

    #profileAbout {
      font-size: 22px;
    }
  }
</style>
