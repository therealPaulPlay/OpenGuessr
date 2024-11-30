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
  import { Plus } from "lucide-svelte";
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
    leaderboardEntries = undefined;
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
        yourEntry = data?.userRank;
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
    getCompetitionsFromServer(false, false, true); // get daily comp
    getCompetitionsFromServer(false); // get initial 10 active comps
    getCompetitionsFromServer(true); // get initial 10 expired comps
  });

  // Search Competitions -------------------------------------------------------------------------------------------------

  let searchQuery = $state();

  function startSearch() {
    let query = searchQuery.toLowerCase();
    activeCompetitionsData = [];

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
  <Popup slim={true}>
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
              {yourEntry.userName}
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
        <div class="emptyLeaderboardBox">
          {#if leaderboardEntries}
            <p class="errorText">No entries yet.</p>
          {:else}
            <p class="errorText">Loading...</p>
          {/if}
        </div>
      {/if}
    </div>
    {#if showRatingsBox}
      <div id="ratingBox">
        <p id="ratingText">{ratingText}</p>
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
  <div class="competitionItem fadeInItem">
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
      <div class="propertyItem">
        <div class="label">
          <p>Plays</p>
        </div>
        <p class="itemText">{playercount.toLocaleString()}</p>
      </div>
      <div class="propertyItem">
        <div class="label">
          <p>Restriction</p>
        </div>
        <p class="itemText">{restriction}</p>
      </div>
      <div class="propertyItem">
        <div class="label">
          <p>Duration</p>
        </div>
        <p class="itemText">{formatDuration(duration)} ({formatDuration(remainingDuration)} left)</p>
      </div>
      <div class="propertyItem">
        <div class="label">
          <p>Rounds</p>
        </div>
        <p class="itemText">{locationAmount}</p>
      </div>
      <div class="propertyItem">
        <div class="label">
          <p>Round length</p>
        </div>
        <p class="itemText">{roundLength}s</p>
      </div>
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      id="aboutItem${id}"
      class="aboutSection competitionDescription"
      role="button"
      tabindex="0"
      onclick={() => {
        playSound("basic_button");
        showConfirmPopup("About", description, false, false, false, true);
      }}
    >
      <div class="label" class:expiredCompetitionColor={expired} role="button" tabindex="0">
        <p>About</p>
      </div>
      <p class="itemText descText">
        {description}
      </p>
    </div>
    <div class="buttonBoxRight competitionButtonBox">
      <button
        class="standardButton competitionButton white"
        onclick={() => {
          playSound("basic_button");
          openLeaderboard(id);
        }}
        >Results
        <img class="textIcon" src="/img/leaderboards_icon.png" alt="Leaderboards for OpenGuessr" />
      </button>
      {#if !expired}
        <button
          class="standardButton competitionButton white"
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
      {/if}
    </div>
  </div>
{/snippet}
<div class="main">
  <div class="competitionElement competitionBox">
    <div class="flexCompetitionBar competitionTitle competitionTitleDaily">
      <h2 class="boxHeader">Competitions</h2>
    </div>
    <div id="dailyCompetitionArea" class="competitionArea">
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
      {:else}
        <p class="errorText">{dailyCompetitionError}</p>
      {/if}
    </div>
  </div>
  <div class="competitionElement competitionBox">
    <div class="flexCompetitionBar competitionTitle">
      <h2 class="boxHeader">Active</h2>
      <button
        class="standardButton white createButton"
        onclick={() => {
          playSound("basic_button");
          if ($isAuthenticated) {
            goto("/competitions/create");
          } else {
            signupPopup.set(true);
          }
        }}>+ Create</button
      >
    </div>
    <div class="buttonToolbar">
      <search>
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
          class="standardButton white"
          onclick={() => {
            playSound("basic_button");
            startSearch();
          }}
        >
          <img src="/img/find_icon.png" alt="start search" id="searchIcon" />
        </button>
        <button
          id="hideEntered"
          class="standardButton white"
          class:hideEnteredActive={hideEntered}
          onclick={() => {
            playSound("basic_button");
            activeCompetitionsData = []; // Reset loaded data
            hideEntered = !hideEntered;
            notExpiredIndex = 0;
            getCompetitionsFromServer(false, false, false, hideEntered);
          }}>Hide entered</button
        >
      </search>
    </div>
    <div id="competitionArea" class="competitionArea">
      <!-- active competitions will be inserted here -->
      {#if activeCompetitionsData?.length > 0}
        {#each activeCompetitionsData as entry}
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
            false,
          )}
        {/each}
      {:else}
        <p class="errorText">{activeCompetitionError}</p>
      {/if}
    </div>
    {#if loadMoreActive}
      <button
        id="loadMoreActive"
        class="loadMore standardButton white"
        onclick={() => {
          playSound("basic_button");
          getCompetitionsFromServer(false, false, false, hideEntered);
        }}>Show more <span class="plusSpan"><Plus size={20} /></span></button
      >
    {/if}
  </div>
  <div class="competitionElement competitionBox expiredBox">
    <div class="competitionTitle competitionTitleExpired">
      <h2 class="boxHeader">Recently ended</h2>
    </div>
    <div id="expiredCompetitionArea" class="competitionArea">
      <!-- expired competitions will be inserted here -->
      {#if expiredCompetitionData?.length > 0}
        {#each expiredCompetitionData as entry}
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
            false,
          )}
        {/each}
      {:else}
        <p class="errorText">{expiredCompetitionsError}</p>
      {/if}
    </div>
    {#if loadMoreExpired}
      <button
        class="loadMore standardButton white"
        onclick={() => {
          playSound("basic_button");
          getCompetitionsFromServer(true);
        }}>Show more <span class="plusSpan"><Plus size={20} /></span></button
      >
    {/if}
  </div>
</div>

<svelte:head>
  <title>Competitions</title>
</svelte:head>

<style>
  .buttonToolbar {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    width: calc(100% - 16px);
    min-width: 280px;
    gap: 10px;
    align-items: center;
    border-radius: 10px;
    padding: 8px;
    margin-top: 5px;
    margin-bottom: 20px;
    background-color: var(--box-color);
  }

  .competitionElement {
    transition:
      background-color 250ms ease,
      filter 250ms ease;
    width: 100%;
    overflow: hidden;
    height: 300px;
    margin-bottom: 20px;
  }

  .main {
    margin-bottom: 100px;
    width: 100%;
    flex-direction: column;
  }

  .emptyLeaderboardBox {
    height: 300px;
    width: 100%;
    display: flex;
    align-items: center;
  }

  .competitionTitle {
    padding-top: 5px;
    padding-bottom: 5px;
    margin-bottom: 10px;
    width: 100%;
  }

  .competitionBox {
    padding-top: 5px;
    padding-bottom: 5px;
    height: auto;
  }

  #competitionArea,
  #expiredCompetitionArea {
    min-height: 200px;
  }

  .competitionDescription {
    border-radius: 10px;
    background-color: var(--box-color);
    padding: 7px;
    padding-inline: 4px;
    font-size: 22px;
    transition: filter 250ms ease;
  }

  .competitionItem {
    border-radius: 15px;
    background-color: var(--box-color);
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
    flex-basis: 25%;
  }

  .label {
    padding: 3px;
    padding-inline: 10px;
    width: fit-content;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    margin-right: 5px;
    margin-left: 4px;
  }

  .label p {
    font-size: 20px;
  }

  .itemText {
    margin: 5px;
    margin-inline: 5px;
    text-overflow: ellipsis;
    overflow: hidden;
    text-wrap: nowrap;
    min-width: 55px;
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
    border-radius: 10px;
    padding: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 39px;
    display: flex;
    align-items: center;
    background-color: var(--box-color);
  }

  .boxHeader {
    text-align: left;
    font-size: 45px;
    margin-top: 10px;
  }

  .descText {
    margin-top: 10px;
    overflow: hidden;
    max-height: 60px;
    margin-inline: 10px;
  }

  .plusSpan {
    vertical-align: -3px;
  }

  .competitionAuthor {
    margin-bottom: 30px;
    padding-left: 2px;
    cursor: pointer;
    transition: opacity 250ms ease;
    max-width: 300px;
    text-wrap: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    user-select: none;
    opacity: 0.5;
  }

  .competitionAuthor:hover {
    opacity: 0.25;
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

  .expiredCompetitionColor {
    background-color: var(--box-color);
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
    max-height: 52vh;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: none;
    padding: 5px;
    background-color: var(--box-color);
    gap: 10px;
    margin-top: 30px;
    outline: 5px solid var(--box-color);
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
    width: 200px;
    padding: 10px;
    margin-bottom: 30px;
    margin-left: calc(50% - 100px);
  }

  search {
    display: flex;
    justify-content: start;
    width: 100%;
    max-width: 450px;
    gap: 5px;
  }

  search form {
    width: 55%;
    margin: 2.5px;
  }

  #competitionSearch {
    width: calc(100% - 20px);
    max-width: 700px;
    transition: background-color 250ms ease;
    font-size: 22px;
    padding: 5px;
    padding-inline: 10px;
    height: 28px;
    text-overflow: ellipsis;
  }

  #startSearch {
    max-width: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
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

  .createButton {
    border-radius: 10px;
    line-height: 35px;
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

  .dailyPrimary {
    background-color: var(--brand-color);
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
    background-color: rgba(125, 189, 144, 0.5);
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

  #hideEntered {
    max-width: 35%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hideEnteredActive {
    background-color: rgba(255, 255, 255, 0.9);
    color: rgb(35, 35, 35) !important;
  }

  #ratingBox {
    border-radius: 10px;
    background-color: var(--box-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 20px;
    padding: 5px;
    gap: 10px;
    width: calc(100% - 10px);
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

  @media all and (max-width: 800px) {
    .boxHeader {
      font-size: 35px;
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
  }
</style>
