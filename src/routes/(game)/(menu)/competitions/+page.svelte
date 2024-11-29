<script>
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { playSound } from "$lib/utils/soundManager";
  import { signupPopup } from "$lib/stores/uiStore";
  import { errorPopup } from "$lib/utils/errorHandling";
  import Popup from "$lib/components/Popup.svelte";
  import { competitionData } from "$lib/stores/context-specific/competitionStore";
  import { loadCompetition } from "$lib/logic/competitionLogic";
  import { isAuthenticated } from "$lib/stores/accountStore";
  import { showConfirmPopup } from "$lib/utils/confirmPopup";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  const competitionsEndpoint = "https://competitions.openguessr.com/competitions";

  // Format Duration of Competitions ---------------------------------------------------------------
  function formatDuration(seconds) {
    if (typeof seconds === "string") {
      seconds = parseInt(seconds, 10);
    }

    if (isNaN(seconds) || seconds < 0) return "0min";

    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);

    let result = [];
    if (days > 0) result.push(`${days}d`);
    if (hours > 0) result.push(`${hours}h`);
    if (minutes > 0 || result.length === 0) result.push(`${minutes}min`);

    return result.join(" ");
  }

  // Enter Competition ------------------------------------------------------------------------------------------------------------------------------
  async function enterCompetition(id, token) {
    try {
      const requestBody = {
        id: localStorage.getItem("id"), // if this is null, that is fine too. This is used to evaluate whether a user has already played certain competitions.
      };

      const response = await fetch(competitionsEndpoint + "/details/" + id, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        try {
          const data = await response.json();

          let activeCompetitionDetails = {
            name: data.name,
            id: data.id,
            roundAmount: data.location_amount,
            roundLength: data.round_length,
            restriction: data.restriction,
            locations: data.locations.locations,
          };

          // Go back to main page and start competition
          competitionData.set(activeCompetitionDetails);
          loadCompetition();
          goto("/");
        } catch (error) {
          console.error("Error parsing competition details: " + error);
        }
      } else {
        let responseData = null;

        try {
          responseData = await response.json();

          let errorMessages = [];

          if (responseData.error) errorMessages.push(responseData.error);
          if (responseData.message) errorMessages.push(responseData.message);

          if (responseData.errors && Array.isArray(responseData.errors)) {
            responseData.errors.forEach((err) => {
              if (err.msg) {
                errorMessages.push(err.msg);
              } else {
                errorMessages.push(JSON.stringify(err));
              }
            });
          }

          errorPopup(
            "Error entering Competition",
            "An error occured trying to enter a competition.",
            errorMessages.join(" "),
          );
        } catch {
          errorPopup(
            "Unknown Competition Error",
            "An error without a proper error message occured entering the competition.",
            "No error - Please check the browser console and request response",
          );
        }
      }
    } catch (error) {
      console.error("Error occurred during competition details fetch ", error);
      errorPopup(
        "Error entering Competition (Network)",
        "A network error occured trying to enter a competition",
        error,
      );
    }
  }

  // Leaderboard ---------------------------------------------------------------------------------------------------------
  let leaderboardPopup = $state(false);
  let showRatingsBox = $state(false);
  let leaderboardCompetitionId;

  function openLeaderboard(id, showRatingBox) {
    leaderboardCompetitionId = id; // Used for e.g. the ratings requests
    leaderboardPopup = true;
    leaderboardEntries = [];
    yourEntry = undefined;
    leaderboardName = "Loading...";

    // Load data from endpoint using id here
    loadLeaderboardFromServer(id);

    if (showRatingBox) {
      displayRatingBox();
    }
  }

  let leaderboardEntries = $state([]);
  let yourEntry = $state();
  let leaderboardName = $state("Default");

  async function loadLeaderboardFromServer(id) {
    try {
      const requestBody = {
        id: localStorage.getItem("id"), // if this is null, that is fine too. This is used to evaluate whether a user has already played certain competitions.
      };

      const response = await fetch(competitionsEndpoint + "/leaderboard/" + id, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        leaderboardEntries = data.leaderboard;
        leaderboardName = data.name;
      } else {
        let responseData = null;

        try {
          responseData = await response.json();
          let errorMessages = [];

          if (responseData.error) errorMessages.push(responseData.error);
          if (responseData.message) errorMessages.push(responseData.message);

          if (responseData.errors && Array.isArray(responseData.errors)) {
            responseData.errors.forEach((err) => {
              if (err.msg) {
                errorMessages.push(err.msg);
              } else {
                errorMessages.push(JSON.stringify(err));
              }
            });
          }

          errorPopup("Failed loading a leaderboard", "An error occured loading a leaderboard", errorMessages.join(" "));
        } catch {
          errorPopup(
            "Unknown error loading a leaderboard",
            "An unknown erorr occured loading a leaderboard.",
            "Please inspect console logs and network requests for more details.",
          );
        }
      }
    } catch (error) {
      console.error("Error occurred during leaderboard load: ", error);
    }
  }

  // Query Links - Enter and Load leaderboard --------------------------------------------------------------------------------------------------------

  onMount(() => {
    if (typeof window === "undefined") return; // Exit if not in browser environment
    let urlParams = new URLSearchParams(window.location.search);

    let leaderboardIdFromLink;
    let leaderboardIdFromLinkAfterSubmit;
    let showRatingBox = false;

    // Load leaderboard via link
    try {
      leaderboardIdFromLink = urlParams.get("leaderboard");

      if (leaderboardIdFromLink) {
        openLeaderboard(leaderboardIdFromLink);
        history.replaceState({}, document.title, window.location.pathname); // reset query in the address bar
      }

      leaderboardIdFromLinkAfterSubmit = urlParams.get("leaderboard-submit");

      if (leaderboardIdFromLinkAfterSubmit) {
        openLeaderboard(leaderboardIdFromLinkAfterSubmit, true);
        history.replaceState({}, document.title, window.location.pathname); // reset query in the address bar
      }
    } catch {}

    // Enter competition via link
    let competitionIdFromLink;

    try {
      competitionIdFromLink = urlParams.get("enter");

      if (competitionIdFromLink) {
        showConfirmPopup(
          "Enter competition from link?",
          "This will start the game immediately. You can only enter a competition once.",
          () => {
            enterCompetition(competitionIdFromLink, localStorage.getItem("bearer"));
          },
        );
        history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
      }
    } catch {}
  });

  // Load competitions ----------------------------------------------------------------------------------------------------------------------------

  let notExpiredIndex = 0;
  let expiredIndex = 0;

  // Competition "Don't show entered Competitions" Filter
  let hideEntered = $state(false);

  // Fetched Data
  let activeCompetitionsData = $state([]);
  let expiredCompetitionData = $state([]);
  let dailyCompetitionData = $state([]);

  let loadMoreActive = $state(false);
  let loadMoreExpired = $state(false);

  // Error texts
  let dailyCompetitionError = $state("Loading...");
  let activeCompetitionError = $state("Loading...");
  let expiredCompetitionsError = $state("Loading...");

  async function getCompetitionsFromServer(expired, search, daily, filterEntered) {
    try {
      let requestBody = {
        id: localStorage.getItem("id"), // if this is null, that is fine too. This is used to evaluate whether a user has already played certain competitions.
      };

      if (search) requestBody.search = search;

      // Always hide load more bar during loading process
      if (!expired) loadMoreActive = false;
      if (expired) loadMoreExpired = false;

      // Endpoint selection
      let Endpoint = null;
      if (!expired) Endpoint = competitionsEndpoint + "/" + notExpiredIndex;
      if (expired) Endpoint = competitionsEndpoint + "/expired/" + expiredIndex;
      if (search) Endpoint = competitionsEndpoint + "/search/" + notExpiredIndex;
      if (daily) Endpoint = competitionsEndpoint + "/daily/daily-competition";
      if (filterEntered) Endpoint = competitionsEndpoint + "/notentered/" + notExpiredIndex;

      const response = await fetch(Endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        let noContentLoaded = true;

        try {
          const data = await response.json();

          if (expired) expiredCompetitionData = [...expiredCompetitionData, ...data.competitions];
          if (!expired && !daily) activeCompetitionsData = [...activeCompetitionsData, ...data.competitions];
          if (!expired && daily) dailyCompetitionData = data.competitions; // Only one, so no need to concatinate arrays here
          console.log(dailyCompetitionData);

          if (!daily) {
            if (!expired) {
              notExpiredIndex += data.competitions?.length;
            } else {
              expiredIndex += data.competitions?.length;
            }
          }

          if (data.competitions?.length > 0) noContentLoaded = false;
          let maxAmountLoaded = data.competitions.length == 10;

          if (!daily) {
            if (expired) {
              loadMoreExpired = maxAmountLoaded; // if the max amount was loaded, there are likely more available
            } else {
              loadMoreActive = maxAmountLoaded;
            }
          }

          if (search && noContentLoaded && notExpiredIndex == 0) activeCompetitionError = "Search returned no results.";
          if (!daily && !search && !expired && noContentLoaded && notExpiredIndex == 0)
            activeCompetitionError = "No active competitions found.";
          if (!daily && !search && expired && noContentLoaded && expiredIndex == 0)
            expiredCompetitionsError = "No expired competitions found.";
          if (daily && !expired && !search && noContentLoaded)
            dailyCompetitionError = "The daily competition is likely being generated right now.";
        } catch (error) {
          console.error("Error during the competition loading and add process: " + error);
        }
      } else {
        let responseData = null;

        try {
          responseData = await response.json();

          let errorMessages = [];

          if (responseData.error) errorMessages.push(responseData.error);
          if (responseData.message) errorMessages.push(responseData.message);

          if (responseData.errors && Array.isArray(responseData.errors)) {
            responseData.errors.forEach((err) => {
              if (err.msg) {
                errorMessages.push(err.msg);
              } else {
                errorMessages.push(JSON.stringify(err));
              }
            });
          }

          document.querySelectorAll(".errorText").forEach((e) => {
            e.textContent = "Error: " + errorMessages.join(" ");
          });
        } catch {
          document.querySelectorAll(".errorText").forEach((e) => {
            e.textContent = "Error did not include json.";
          });
        }
      }
    } catch (error) {
      console.error("Error occurred during competition load: ", error);
      return "A network error has occurred.";
    }
  }

  // Initial Load
  onMount(() => {
    getCompetitionsFromServer(false, undefined, true); // get daily comp
    getCompetitionsFromServer(false); // get initial 10 active comps
    getCompetitionsFromServer(true); // get initial 10 expired comps
  });

  // Search Competitions -------------------------------------------------------------------------------------------------

  let searchQuery = $state();

  function startSearch() {
    let query = searchQuery.toLowerCase();

    if (hideEntered) {
      document.getElementById("hideEntered").classList.remove("hideEnteredActive");
      hideEntered = false;
    }

    notExpiredIndex = 0; // reset index if starting new search
    if (query == "") query = undefined; // so the undefined check works in the load function

    getCompetitionsFromServer(false, query);
  }

  // Rating -------------------------------------------------------------------------------------------

  let ratingText = $state();
  let ratingsButtonBox = $state(false);

  function displayRatingBox() {
    showRatingsBox = true;
    ratingsButtonBox = true;
    ratingText = "Rate this competition.";
  }

  async function submitRating(factor) {
    ratingsButtonBox = false;
    ratingText = "Submitting rating...";

    try {
      const body = {
        id: localStorage.getItem("id"),
        compId: Number(leaderboardCompetitionId),
        updateFactor: factor,
      };

      const response = await fetch("https://competitions.openguessr.com/competitions/ranking", {
        method: "POST",
        headers: {
          Authorization: `Bearer ` + localStorage.getItem("bearer"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let error = await response.json().error;
        if (!error) error = response.status;

        console.error("An occured submitting the competition rating: " + error);
        ratingText = "Error: " + error;
      } else {
        ratingText = "Rating received. Thank you!";
      }
    } catch (error) {
      console.error("A network error occured submitting the competition rating: " + error);
      ratingText = "Network error.";
    }
  }
</script>

{#if leaderboardPopup}
  <Popup>
    <h1 id="leaderboardHeader" class="textHeaderLeft">Ranking for {leaderboardName}</h1>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div id="rankingDisplay" class="rankingDisplay">
      {#if yourEntry}
        <div class="youBar bottomMarginItem">
          <p class="youLabel">You:</p>
          <div class="rankItem" class:leaderboardSupporterEntry={yourEntry.supporter_level > 0}>
            <p class="leaderboardTextEntry">#{yourEntry.position}</p>
            <p
              id="yourUsername"
              class="leaderboardTextEntry centerEntry"
              onclick={() => {
                loadProfileFromId(localStorage.getItem("id"), true);
              }}
            >
              {youItem.userName}
            </p>
            <p class="leaderboardTextEntry">{yourEntry.score.toLocaleString()} Pts.</p>
          </div>
        </div>
      {/if}
      {#if leaderboardEntries?.length > 0}
        {#each leaderboardEntries as entry}
          <div
            class="rankItem"
            class:leaderboardSupporterEntry={entry.supporter_level > 0}
            class:rankYou={entry.id == localStorage.getItem("id")}
          >
            <p class="leaderboardTextEntry">#{entry.position}</p>
            <p
              class="leaderboardTextEntry centerEntry"
              onclick={() => {
                loadProfileFromId(entry.id, true);
              }}
            >
              {entry.userName}
            </p>
            <p class="leaderboardTextEntry">{entry.score.toLocaleString()} Pts.</p>
          </div>
        {/each}
      {:else}
        <p>No entries yet.</p>
      {/if}
    </div>
    {#if showRatingsBox}
      <div id="ratingBox">
        <p id="ratingText">Rate this competition (Default)</p>
        {#if ratingsButtonBox}
          <div class="ratingButtonBox" id="ratingButtonBox">
            <button
              class="standardButton rateButton"
              id="rateGood"
              onclick={() => {
                submitRating(5);
              }}
            >
              <img class="ratingIcon" alt="good" src="/img/rating_good_icon.png" />
            </button>
            <button
              class="standardButton rateButton"
              id="rateBad"
              onclick={() => {
                submitRating(-3);
              }}
            >
              <img class="ratingIcon" alt="bad" src="/img/rating_bad_icon.png" />
            </button>
            <button
              class="standardButton rateButton"
              id="rateBroken"
              onclick={() => {
                submitRating(-10);
              }}
            >
              <img class="ratingIcon" alt="broken" src="/img/rating_broken_icon.png" />
            </button>
          </div>
        {/if}
      </div>
    {/if}
    <div class="buttonBoxRight">
      <button
        id="leaderboardClose"
        class="standardButton white closeButton"
        onclick={() => {
          playSound("basic_button");
          showRatingsBox = false;
          leaderboardPopup = false;
        }}>Close</button
      >
    </div>
  </Popup>
{/if}

<!-- Competition Item Component -->
{#snippet competitionItem(
  id,
  name,
  author,
  authorId,
  playercount,
  restriction,
  duration,
  remainingDuration,
  locationAmount,
  roundLength,
  description,
  expired,
  entered,
  daily,
)}
  <div class="competitionItem fadeInItem" class:dailyItem={daily}>
    <h2 class="competitionItemHeader">{name}</h2>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <p
      class="competitionAuthor"
      onclick={() => {
        const id = authorId == 0 ? 2 : authorId; // Set to 2 (PaulPlay) if created by System (0)
        loadProfileFromId(id, true);
      }}
    >
      hosted by {author}
    </p>
    <div class="competitionPropertiesBox">
      <div class="propertyItem" class:expiredCompetitionColor={expired} class:dailyItem={daily}>
        <div class="label" class:expiredCompetitionColor={expired} class:dailyItem={daily}>
          <p>Plays</p>
        </div>
        <p class="itemText">{playercount.toLocaleString()}</p>
      </div>
      <div class="propertyItem" class:expiredCompetitionColor={expired} class:dailyItem={daily}>
        <div class="label" class:expiredCompetitionColor={expired} class:dailyItem={daily}>
          <p>Restriction</p>
        </div>
        <p class="itemText">{restriction}</p>
      </div>
      <div class="propertyItem" class:expiredCompetitionColor={expired} class:dailyItem={daily}>
        <div class="label" class:expiredCompetitionColor={expired} class:dailyItem={daily}>
          <p>Duration</p>
        </div>
        <p class="itemText">{formatDuration(duration)} ({formatDuration(remainingDuration)} left)</p>
      </div>
      <div class="propertyItem" class:expiredCompetitionColor={expired} class:dailyItem={daily}>
        <div class="label" class:expiredCompetitionColor={expired} class:dailyItem={daily}>
          <p>Rounds</p>
        </div>
        <p class="itemText">{locationAmount}</p>
      </div>
      <div class="propertyItem" class:expiredCompetitionColor={expired} class:dailyItem={daily}>
        <div class="label" class:expiredCompetitionColor={expired} class:dailyItem={daily}>
          <p>Round length</p>
        </div>
        <p class="itemText">{roundLength}s</p>
      </div>
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      id="aboutItem${id}"
      class="aboutSection competitionDesc"
      role="button"
      tabindex="0"
      onclick={() => {
        playSound("basic_button");
        showConfirmPopup("About", description, false, false, false, true);
      }}
      class:expiredCompetitionColor={expired}
      class:dailyItem={daily}
    >
      <div class="label" class:expiredCompetitionColor={expired} role="button" tabindex="0" class:dailyItem={daily}>
        <p>About</p>
      </div>
      <p class="itemText descText">
        {description}
      </p>
    </div>
    <div class="buttonBoxRight competitionButtonBox">
      <button
        class="standardButton competitionButton leftButton"
        class:expiredLeaderboardColor={expired}
        class:dailyLeaderboardButton={daily}
        onclick={() => {
          playSound("basic_button");
          openLeaderboard(id);
        }}
        >Results
        <img class="textIcon" src="/img/leaderboards_icon.png" alt="Leaderboards for OpenGuessr" />
      </button>
      <button
        class="standardButton competitionButton primaryButton"
        class:dailyPrimary={daily}
        class:buttonDisabled={entered || authorId == localStorage.getItem("id")}
        onclick={() => {
          playSound("basic_button");

          if ($isAuthenticated) {
            showConfirmPopup(
              "Enter " + name + "?",
              "This will start the game immediately. You can only enter a competition once.",
              () => {
                enterCompetition(id, localStorage.getItem("bearer"));
              },
            );
          } else {
            signupPopup.set(true);
          }
        }}>{entered ? "Already entered" : authorId == localStorage.getItem("id") ? "Hosted by you" : "Enter"}</button
      >
    </div>
  </div>
{/snippet}

<div class="main-container">
  <button
    class="standardButton white"
    onclick={() => {
      playSound("basic_button");
      if ($isAuthenticated) {
        goto("/competitions/create");
      } else {
        signupPopup.set(true);
      }
    }}>+ Create</button
  >
  <div class="main center">
    <div class="competitionElement competitionBox expiredBox">
      <div class="flexCompetitionBar competitionElement competitionTitle competitionTitleDaily">
        <h2 class="boxHeader">Daily Competition:</h2>
      </div>
      <div id="dailyCompetitionArea" class="center competitionArea">
        <!-- daily competitions will be inserted here -->
        {#if dailyCompetitionData?.length > 0}
          {#each dailyCompetitionData as entry}
            {@render competitionItem(
              entry.id,
              entry.name,
              entry.author,
              entry.author_id,
              entry.playercount,
              entry.restriction,
              entry.duration,
              entry.remainingDuration,
              entry.location_amount,
              entry.round_length,
              entry.description,
              entry.expired,
              entry.entered,
              true,
            )}
          {/each}
        {/if}
        {#if dailyCompetitionError}
          <p class="errorText">{dailyCompetitionError}</p>
        {/if}
      </div>
    </div>
    <div class="competitionElement competitionBox">
      <div class="flexCompetitionBar competitionElement competitionTitle">
        <h2 class="boxHeader">Currently ongoing:</h2>
        <search>
          <button
            id="hideEntered"
            class="standardButton searchBarButton"
            class:hideEnteredActive={hideEntered}
            onclick={() => {
              playSound("basic_button");
              hideEntered = !hideEntered;
              activeCompetitionsData = []; // Reset loaded data
              getCompetitionsFromServer(false, undefined, undefined, hideEntered);
            }}>Hide entered</button
          >
          <form>
            <input
              id="competitionSearch"
              bind:value={searchQuery}
              placeholder="Search active Competitions..."
              onkeydown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                }
              }}
              onkeyup={(event) => {
                if (event.key === "Enter") {
                  startSearch();
                }
              }}
            />
          </form>
          <button
            id="startSearch"
            class="searchBarButton standardButton"
            onclick={() => {
              playSound("basic_button");
              startSearch();
            }}
          >
            <img src="/img/find_icon.png" alt="start search" id="searchIcon" />
          </button>
        </search>
      </div>
      <div id="competitionArea" class="center competitionArea">
        <!-- active competitions will be inserted here -->
        {#if activeCompetitionError}
          <p class="errorText">{activeCompetitionError}</p>
        {/if}
      </div>
      {#if loadMoreActive}
        <button
          id="loadMoreActive"
          class="loadMore standardButton"
          onclick={() => {
            playSound("basic_button");
            getCompetitionsFromServer(false, undefined, undefined, hideEntered);
          }}>Show more ▼</button
        >
      {/if}
    </div>
    <div class="competitionElement competitionBox expiredBox">
      <div class="competitionElement competitionTitle competitionTitleExpired">
        <h2 class="boxHeader">Recently ended:</h2>
      </div>
      <div id="expiredCompetitionArea" class="center competitionArea">
        <!-- expired competitions will be inserted here -->
        {#if expiredCompetitionsError}
          <p class="errorText">{expiredCompetitionsError}</p>
        {/if}
      </div>
      {#if loadMoreExpired}
        <button
          class="loadMore standardButton"
          onclick={() => {
            playSound("basic_button");
            getCompetitionsFromServer(true);
          }}>Show more ▼</button
        >
      {/if}
    </div>
  </div>
</div>

<svelte:head>
  <title>Competitions</title>
</svelte:head>

<style>
  .main-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  h1 {
    margin-bottom: 12px;
    margin-top: 10px;
    text-overflow: ellipsis;
  }

  h2 {
    text-align: left;
    margin-bottom: 10px;
    margin-top: 5px;
    text-overflow: ellipsis;
  }

  .competitionElement {
    border-radius: 15px;
    background-color: rgba(255, 255, 255, 0.1);
    transition:
      background-color 250ms ease,
      filter 250ms ease;
    width: calc(90% - 60px);
    max-width: 1150px;
    padding: 25px;
    overflow: hidden;
    height: 300px;
    filter: brightness(1);
    margin-bottom: 20px;
  }

  .competitionElement:hover {
    filter: brightness(1.2);
  }

  .main {
    margin-top: 150px;
    margin-bottom: 100px;
    width: 100%;
    flex-direction: column;
  }

  .competitionTitle {
    padding-top: 5px;
    padding-bottom: 5px;
    height: auto;
    background-color: rgba(133, 75, 75, 0.15);
    margin-top: -5px;
    width: 100%;
    margin-left: -25px;
    box-shadow: none;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    filter: none !important;
  }

  .competitionBox {
    padding-top: 5px;
    padding-bottom: 5px;
    height: auto;
    background-color: rgba(255, 120, 120, 0.15);
    filter: none !important;
  }

  #competitionArea,
  #expiredCompetitionArea {
    min-height: 200px;
  }

  .competitionDesc {
    border-radius: 5px;
    background-color: rgba(255, 141, 141, 0.15);
    padding: 10px;
    font-size: 22px;
    transition: filter 250ms ease;
    filter: none;
  }

  .competitionItem {
    border-radius: 10px;
    background-color: rgba(255, 141, 141, 0.15);
    transition:
      background-color 250ms ease,
      filter 250ms ease,
      opacity 250ms ease;
    width: calc(25% - 60px);
    flex-grow: 1;
    min-width: 220px;
    padding: 20px;
    overflow: hidden;
    height: fit-content;
    filter: brightness(1);
    flex-basis: 25%;
  }

  .label {
    padding: 2px;
    padding-inline: 10px;
    width: fit-content;
    background-color: rgba(225, 156, 156, 0.2);
    border-radius: 5px;
    margin-right: 5px;
  }

  .label p {
    font-size: 20px;
  }

  .itemText {
    margin: 6px;
    margin-inline: 5px;
    text-overflow: ellipsis;
    overflow: hidden;
    text-wrap: nowrap;
    min-width: 40px;
  }

  .competitionItem:hover {
    filter: brightness(1.2);
  }

  .competitionItemHeader {
    margin-bottom: 0;
    text-overflow: ellipsis;
    overflow: hidden;
    text-wrap: nowrap;
    font-size: 35px;
  }

  .competitionPropertiesBox {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    flex-wrap: wrap;
    border-radius: 5px;
    gap: 10px;
  }

  .propertyItem {
    flex-grow: 1;
    border-radius: 5px;
    padding: 6px;
    padding-bottom: 0;
    padding-top: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 39px;
    display: flex;
    align-items: center;
    background-color: rgba(255, 141, 141, 0.15);
  }

  .boxHeader {
    text-align: left;
    font-size: 30px;
    margin-top: 10px;
  }

  .descText {
    margin-top: 10px;
    overflow: hidden;
    max-height: 60px;
  }

  .competitionAuthor {
    margin-bottom: 30px;
    padding-left: 2px;
    color: rgba(249, 216, 216, 0.5);
    cursor: pointer;
    transition: opacity 250ms ease;
    max-width: 300px;
    text-wrap: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    user-select: none;
  }

  .competitionAuthor:hover {
    opacity: 0.5;
  }

  .primaryButton {
    background-color: rgb(181, 63, 63);
  }

  .textIcon {
    width: 25px;
    height: 25px;
    vertical-align: -2px;
  }

  .textHeaderLeft {
    text-align: left;
    text-overflow: ellipsis;
    overflow: hidden;
    text-wrap: nowrap;
  }

  .expiredBox {
    background-color: rgba(122, 125, 156, 0.15);
  }

  .expiredCompetitionColor {
    background-color: rgba(164, 140, 140, 0.15);
  }

  .expiredLeaderboardColor {
    background-color: rgba(255, 176, 176, 0.2);
  }

  .competitionArea {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
    padding-bottom: 20px;
    justify-content: flex-start;
  }

  #contentSection {
    transition: max-height 250ms ease-in-out;
    max-height: 0px;
    overflow: hidden;
  }

  .errorText {
    width: 100%;
    text-align: center;
    opacity: 0.5;
  }

  .rankingDisplay {
    display: flex;
    justify-content: safe center;
    flex-direction: column;
    width: calc(100% - 10px);
    border-radius: 5px;
    max-height: 50vh;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: none;
    padding: 5px;
    background-color: rgba(255, 255, 255, 0.1);
    gap: 10px;
    margin-top: 30px;
    outline: 5px solid rgba(255, 255, 255, 0.1);
  }

  .rankItem {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    width: calc(100% - 20px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px;
    padding-inline: 10px;
  }

  .rankYou {
    background-color: rgba(255, 255, 255, 0.3);
  }

  #toggleFaqBar {
    cursor: pointer;
  }

  #inputArea {
    padding: 10px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
  }

  #infoNoteIcon {
    width: 35px;
    height: 35px;
    margin-bottom: 20px;
    margin-top: 7px;
    opacity: 0.5;
    margin-left: -10px;
  }

  #createWindow {
    max-width: 900px;
  }

  #uploadHeader {
    text-align: left;
    margin-top: 5px;
    margin-bottom: 30px;
  }

  #uploadFirstText {
    font-size: 25px;
  }

  #uploadCompetitionDescription {
    max-width: 500px;
  }

  .bottomMarginItem {
    margin-bottom: 20px;
  }

  #visibilityInfo {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .loadMore {
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 22px;
    min-height: 40px;
    width: 280px;
    padding: 10px;
    margin-bottom: 30px;
    margin-left: calc(50% - 140px);
    display: none;
  }

  search {
    display: flex;
    justify-content: center;
    width: 100%;
    max-width: 450px;
    gap: 10px;
    margin-right: -15px;
  }

  search form {
    width: 55%;
  }

  #competitionSearch {
    border-radius: 10px;
    outline: none;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    width: calc(100% - 20px);
    max-width: 700px;
    transition: background-color 250ms ease;
    font-size: 22px;
    min-height: 40px;
    border: none;
    font-family: Barlow;
    padding: 5px;
    padding-inline: 10px;
    text-overflow: ellipsis;
  }

  #competitionSearch:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.2);
  }

  #startSearch {
    max-width: 30px;
    min-height: 40px;
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .searchBarButton {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: white;
    margin: 0;
  }

  #searchIcon {
    width: 20px;
    height: 20px;
  }

  .flexCompetitionBar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .fadeInItem {
    animation: fadeIn 100ms ease-in-out;
  }

  .youBar {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .youLabel {
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 5px;
    padding-inline: 10px;
  }

  .dailyItem {
    background-color: rgba(181, 193, 230, 0.15);
  }

  .dailyPrimary {
    background-color: rgb(79, 137, 166);
  }

  .dailyLeaderboardButton {
    background-color: rgba(147, 203, 225, 0.4);
  }

  #contentSelection {
    overflow: hidden;
  }

  .leaderboardTextEntry {
    overflow: hidden;
    text-wrap: nowrap;
    text-overflow: ellipsis;
  }

  .leaderboardSupporterEntry {
    background-color: rgba(175, 220, 189, 0.3);
  }

  .centerEntry {
    max-width: 50%;
    transition: opacity 250ms ease;
    cursor: pointer;
    user-select: none;
  }

  .centerEntry:hover {
    opacity: 0.5;
  }

  .aboutSection {
    cursor: pointer;
  }

  .aboutSection:hover {
    filter: brightness(1.2);
  }

  .competitionTitleDaily {
    background-color: rgba(70, 74, 92, 0.15);
  }

  .competitionTitleExpired {
    background-color: rgba(70, 74, 92, 0.15);
  }

  #hideEntered {
    max-width: 35%;
    overflow: hidden;
    text-overflow: ellipsis;
    color: rgb(176, 166, 169);
    transition:
      color 250ms ease,
      background-color 250ms ease,
      filter 250ms ease;
  }

  .hideEnteredActive {
    background-color: rgba(255, 255, 255, 0.9);
    color: rgb(35, 35, 35) !important;
  }

  #ratingBox {
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 20px;
    padding: 5px;
    gap: 10px;
  }

  #ratingBox p {
    padding-inline: 5px;
  }

  .rateButton {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 5px;
    margin: 0;
  }

  .ratingButtonBox {
    display: flex;
    gap: 5px;
    justify-content: center;
    align-items: center;
  }

  .ratingIcon {
    width: 22px;
    height: 22px;
    filter: invert();
    vertical-align: -3px;
  }

  .buttonDisabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @media all and (orientation: portrait) {
    .boxHeader {
      font-size: 25px;
    }

    .competitionItem {
      flex-grow: 1;
    }

    .competitionButton {
      flex-grow: 1;
    }

    .competitionItemHeader {
      font-size: 27px;
    }

    .label p {
      font-size: 18px;
    }
  }
</style>
