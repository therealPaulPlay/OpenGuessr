<script>
  import { getLeaderboard, getUserLeaderboard, getSupporterLeaderboard } from "$lib/logic/userAPI";
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { isAuthenticated, username } from "$lib/stores/accountStore";
  import { playSound } from "$lib/utils/soundManager";

  // Add leaderboar entries --------------------------------------------------------------------------------------------------------
  let mainSectionEntries = $state();
  let userSectionEntries = $state();

  // Load leaderboard data -------------------------------------------------------------------------------------------------------
  async function loadLeaderboard(leaderboardType) {
    switch (leaderboardType) {
      case "experience":
        mainSectionEntries = await getLeaderboard();
        break;
      case "experience-supporter":
        mainSectionEntries = await getSupporterLeaderboard();
        break;
    }
  }

  let potentialUserLeaderboardType = $state("none");

  // A section to show where the user is at, as well as a few others above them ------------------------------------------------------
  async function loadUserLeaderboard(leaderboardType) {
    potentialUserLeaderboardType = "none"; // Reset user leaderboard as it is now (soon) loaded

    if ($isAuthenticated) {
      switch (leaderboardType) {
        case "experience":
          userSectionEntries = await getUserLeaderboard();
          break;
        default:
          return;
      }
    }
  }

  // Check if user section is in view -------------------------------------------------------------------------------------

  let scrollTimeout;

  if (typeof window !== "undefined") {
    document.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        checkIfUserSectionIsInView();
      }, 150);
    });
  }

  function checkIfUserSectionIsInView() {
    // If the user has scrolled down more than 1000px, load the user leaderboard section (which is at the end)
    if (window.scrollY > 1000 && potentialUserLeaderboardType) {
      loadUserLeaderboard(potentialUserLeaderboardType);
    }
  }

  // Filter / Sort Options -------------------------------------------------------------------------------------------------

  let filter = $state("all");

  function loadCorrectLeaderboard() {
    mainSectionEntries = undefined;
    userSectionEntries = undefined;

    switch (filter) {
      case "all":
        loadLeaderboard("experience");
        potentialUserLeaderboardType = "experience";
        break;
      case "supporter":
        loadLeaderboard("experience-supporter");
        potentialUserLeaderboardType = "none";
        break;
    }
  }

  loadCorrectLeaderboard();
</script>

<div class="podium-container">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div id="podium" class="podium" class:podium-loaded={Boolean(mainSectionEntries)}>
    <div
      class="podium-item silver"
      id="second-place"
      onclick={() => {
        loadProfileFromId(mainSectionEntries?.[1]?.id, true);
      }}
    >
      <div class="name">{mainSectionEntries?.[1]?.user_name || "Guest"}</div>
      <div class="podiumExp">{mainSectionEntries?.[1]?.experience.toLocaleString() || "0 XP"}</div>
      <div class="rank">#2</div>
    </div>
    <div
      class="podium-item gold"
      id="first-place"
      onclick={() => {
        loadProfileFromId(mainSectionEntries?.[0]?.id, true);
      }}
    >
      <div class="name">{mainSectionEntries?.[0]?.user_name || "Guest"}</div>
      <div class="podiumExp">{mainSectionEntries?.[0]?.experience?.toLocaleString() || "0 XP"}</div>
      <div class="rank">#1</div>
    </div>
    <div
      class="podium-item bronze"
      id="third-place"
      onclick={() => {
        loadProfileFromId(mainSectionEntries?.[2]?.id, true);
      }}
    >
      <div class="name">{mainSectionEntries?.[2]?.user_name || "Guest"}</div>
      <div class="podiumExp">{mainSectionEntries?.[2]?.experience?.toLocaleString() || "0 XP"}</div>
      <div class="rank">#3</div>
    </div>
  </div>
</div>
<div class="container" id="filterContainer">
  <div class="optionBar">
    <button
      id="filterAll"
      class="standardButton white optionButton"
      class:optionButtonSelected={filter == "all"}
      onclick={() => {
        filter = "all";
        playSound("basic_button");
        loadCorrectLeaderboard();
      }}>All</button
    >
    <button
      id="filterSupporter"
      class="standardButton white optionButton"
      class:optionButtonSelected={filter == "supporter"}
      onclick={() => {
        filter = "supporter";
        playSound("basic_button");
        loadCorrectLeaderboard();
      }}>Supporters</button
    >
  </div>
</div>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="leaderboardContainer" id="leaderboardContainer">
  <div id="container" class="container">
    {#if mainSectionEntries}
      {#each mainSectionEntries.slice(3) as entry, i}
        <div
          class="rankedItem"
          role="button"
          tabindex="0"
          class:yourItem={entry.user_name == $username && $isAuthenticated}
          class:rankedItemSupporter={entry.supporter_level >= 1}
          onclick={() => {
            loadProfileFromId(entry.id, true);
          }}
        >
          <p class="maxlength rankedItemLeft">#{entry.position}</p>
          <p class="middle maxlength">{entry.user_name}</p>
          <p class="maxlength rankedItemRight">{entry.experience.toLocaleString()} XP</p>
        </div>
      {/each}
    {:else}
      <p class="loadingText">Loading...</p>
    {/if}
  </div>
  {#if userSectionEntries}
    <div id="threeDotsContainer" class="threeDotsContainer">
      <div class="circleDot"></div>
      <div class="circleDot"></div>
      <div class="circleDot"></div>
    </div>
    <div id="yourLeagueContainer" class="container">
      {#each userSectionEntries as entry, i}
        <div
          class="rankedItem"
          role="button"
          tabindex="0"
          class:yourItem={entry.user_name == $username && $isAuthenticated}
          class:rankedItemSupporter={entry.supporter_level >= 1}
          onclick={() => {
            loadProfileFromId(entry.id, true);
          }}
        >
          <p class="maxlength rankedItemLeft">#{entry.position}</p>
          <p class="middle maxlength">{entry.user_name}</p>
          <p class="maxlength rankedItemRight">{entry.experience.toLocaleString()} XP</p>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .loadingText {
    color: white;
    font-size: 25px;
  }

  .optionBar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    padding-bottom: 5px;
    overflow-x: auto;
    overflow-y: hidden;
    margin-right: auto;
    margin-left: 18px;
    margin-bottom: 22px;
    width: fit-content;
    background-color: rgba(92, 93, 94, 0.1);
    border-radius: 13px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }

  #filterContainer {
    background: none;
    margin-bottom: -22px;
  }

  .optionButton {
    border-radius: 7px;
    min-height: 25px;
    margin: 0;
    padding: 5px;
    padding-inline: 10px;
    height: 100%;
    opacity: 0.5;
  }

  .optionButtonSelected {
    opacity: 1;
  }

  .container {
    width: 80vw;
    max-width: 800px;
    text-align: center;
  }

  .rankedItem {
    width: 100%;
    height: 45px;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.1);
    border: solid 3px rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
    border-radius: 8px;
    margin: 10px 0px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0;
    padding-inline: 25px;
    white-space: nowrap;
    color: white;
    font-size: 25px;
    transition: opacity 250ms ease;
  }

  .rankedItemSupporter {
    background-color: rgba(137, 255, 183, 0.35);
    box-sizing: border-box;
    border: 3px solid rgba(137, 255, 183, 0.35);
    position: relative;
  }

  .rankedItemSupporter::before {
    animation: supporterGlint 5s 2s infinite;
    background: linear-gradient(90deg, #00ff1c00 1%, #73ff96 50%, #00ff3400);
    border-radius: inherit;
    content: "";
    height: 4px;
    inset: -4px;
    opacity: 0;
    position: absolute;
    transform: translate(0);
    width: 50%;
    z-index: 1;
  }

  @keyframes supporterGlint {
    10% {
      opacity: 1;
    }

    20% {
      opacity: 0;
      transform: translate(100%);
    }

    21% {
      opacity: 0;
      transform: translate(100%, 41px);
    }

    30% {
      opacity: 1;
    }

    40% {
      opacity: 0;
      transform: translateY(41px);
    }

    41% {
      opacity: 0;
      transform: translate(0);
    }

    50% {
      opacity: 1;
    }

    60% {
      opacity: 0;
      transform: translate(100%);
    }
  }

  .middle {
    transition: opacity 250ms ease;
    cursor: pointer;
    user-select: none;
  }

  .middle:hover {
    opacity: 0.5;
  }

  .gold {
    background-color: #caa128;
  }

  .silver {
    background-color: #898993;
  }

  .bronze {
    background-color: #803b3b;
  }

  .yourItem {
    border: solid 3px white;
  }

  .maxlength {
    max-width: 42%;
    text-overflow: ellipsis;
    overflow: hidden;
    flex-grow: 1;
    flex-basis: 0;
  }

  .rankedItemLeft {
    text-align: left;
  }

  .rankedItemRight {
    text-align: right;
  }

  .leaderboardContainer {
    border-radius: 20px;
    background-color: rgba(92, 93, 94, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: calc(80vw + 30px);
    max-width: 830px;
    margin-top: 20px;
    padding: 5px;
    padding-inline: 0;
  }

  .podium-container {
    display: flex;
    justify-content: center;
    margin-top: 220px;
    margin-bottom: 30px;
  }

  .podium {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 250px;
    width: 70vw;
    max-width: 650px;
    gap: 20px;
    position: relative;
    transform: scale(0.9);
    opacity: 0.3;
    transition:
      opacity 250ms ease,
      transform 250ms ease;
  }

  .podium-loaded {
    opacity: 1;
    transform: scale(1);
  }

  .podium-item {
    flex-grow: 1;
    margin: 0 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 15px;
    cursor: pointer;
    transition:
      filter 250ms ease,
      height 250ms ease,
      width 250ms ease;
    outline: 10px solid rgba(92, 93, 94, 0.1);
    max-width: 25%;
  }

  .podium-item:hover {
    filter: brightness(1.2);
  }

  #first-place {
    height: 200px;
    flex-grow: 1.5;
  }

  #second-place {
    height: 170px;
  }

  #third-place {
    height: 140px;
  }

  .podium-item .name {
    padding: 5px;
    text-align: center;
    color: white;
    font-size: 25px;
    word-break: break-word;
    max-width: 100%;
    position: relative;
    top: -55px;
    overflow: hidden;
    text-overflow: ellipsis;
    text-wrap: nowrap;
  }

  .podium-item .rank {
    font-size: 30px;
    color: white;
    margin-bottom: 20px;
  }

  .podium-item .podiumExp {
    font-size: 25px;
    color: white;
    margin-top: auto;
    margin-bottom: auto;
    max-width: 17vw;
    overflow: hidden;
    text-overflow: ellipsis;
    text-wrap: nowrap;
    opacity: 0.75;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.1);
    padding-inline: 5px;
  }

  #yourLeagueContainer {
    margin-top: 25px;
    min-height: 30px;
  }

  .threeDotsContainer {
    width: 80vw;
    max-width: 800px;
    overflow: hidden;
    justify-content: center;
    gap: 15px;
    margin-top: 25px;
    display: flex;
  }

  .circleDot {
    padding: 8px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.1);
  }

  @media all and (orientation: portrait) {
    p,
    .optionButton {
      font-size: 20px;
    }

    .podium-item {
      border-radius: 10px;
    }

    .podium-item .rank {
      font-size: 20px;
    }

    .podium-item .name {
      font-size: 25px;
    }

    .podium-item .podiumExp {
      font-size: 18px;
    }

    #first-place {
      height: 160px;
    }

    #second-place {
      height: 130px;
    }

    #third-place {
      height: 110px;
    }

    .podium {
      width: 85vw;
      height: 150px;
      gap: 10px;
    }

    .podium-item .name {
      font-size: 20px;
    }

    .maxlength {
      flex-basis: unset;
    }
  }
</style>
