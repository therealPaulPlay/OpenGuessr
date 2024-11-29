<script>
  import { loadProfileFromId } from "$lib/utils/loadProfile";
  import { playSound } from "$lib/utils/soundManager";
  import { signupPopup } from "$lib/stores/uiStore";
  import { errorPopup } from "$lib/utils/errorHandling";
  import { isAuthenticated } from "$lib/stores/accountStore";
  import { showConfirmPopup } from "$lib/utils/confirmPopup";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  const competitionsEndpoint = "https://competitions.openguessr.com/competitions";

  // add competitions programmatically ---------------------------------------------------------------

  let normalAddSuccessful = false;
  let expiredAddSuccessful = false;
  let firstLoad = false;

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

  let competitionHostIdCounter = 0;

  function addCompetition(
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
  ) {
    let container = expired
      ? document.getElementById("expiredCompetitionArea")
      : document.getElementById("competitionArea");

    if (daily) {
      container = document.getElementById("dailyCompetitionArea");
      container.innerHTML = "";
    } else {
      // clean container on load of first competition for each one.
      if (!expired && !normalAddSuccessful) {
        container.innerHTML = "";
        normalAddSuccessful = true;
      }

      if (expired && !expiredAddSuccessful) {
        container.innerHTML = "";
        expiredAddSuccessful = true;
      }
    }

    let displayEnterButton = expired ? "display: none;" : "";
    let expiredItem = expired ? " expiredCompetitionColor" : "";
    let dailyItem = daily ? " dailyItem" : "";
    let dailyPrimary = daily ? " dailyPrimary" : "";
    let dailyLeaderboardButton = daily ? " dailyLeaderboardButton" : "";
    let expiredLeaderboardButton = expired ? " expiredLeaderboardColor" : "";

    let competitionItem = document.createElement("div");
    competitionItem.className = `competitionItem fadeInItem${expiredItem}${dailyItem}`;
    competitionHostIdCounter++;

    competitionItem.innerHTML = `
                        <h2 class="competitionItemHeader">${name}</h2>
                        <p id="host${competitionHostIdCounter}" class="competitionAuthor">hosted by ${author}</p>
                        <div class="competitionPropertiesBox">
                            <div class="propertyItem${expiredItem}${dailyItem}">
                                <div class="label${expiredItem}${dailyItem}">
                                    <p>Plays</p>
                                </div>
                                <p class="itemText">${playercount.toLocaleString()}</p>
                            </div>
                            <div class="propertyItem${expiredItem}${dailyItem}">
                                <div class="label${expiredItem}${dailyItem}">
                                    <p>Restriction</p>
                                </div>
                                <p class="itemText">${restriction}</p>
                            </div>
                            <div class="propertyItem${expiredItem}${dailyItem}">
                                <div class="label${expiredItem}${dailyItem}">
                                    <p>Duration</p>
                                </div>
                                <p class="itemText">${formatDuration(duration)} (${formatDuration(remainingDuration)} left)</p>
                            </div>
                            <div class="propertyItem${expiredItem}${dailyItem}">
                                <div class="label${expiredItem}${dailyItem}">
                                    <p>Rounds</p>
                                </div>
                                <p class="itemText">${locationAmount}</p>
                            </div>
                            <div class="propertyItem${expiredItem}${dailyItem}">
                                <div class="label${expiredItem}${dailyItem}">
                                    <p>Round length</p>
                                </div>
                                <p class="itemText">${roundLength}s</p>
                            </div>
                        </div>
                        <div id="aboutItem${id}" class="aboutSection competitionDesc${expiredItem}${dailyItem}">
                            <div class="label${expiredItem}${dailyItem}">
                                <p>About</p>
                            </div>
                            <p class="itemText descText">${description}</p>
                        </div>
                        <div class="buttonBox competitionButtonBox">
                            <button id="leaderboardButton${id}" class="standardButton competitionButton leftButton${expiredLeaderboardButton}${dailyLeaderboardButton}">Results
                                <img class="textIcon invert" src="/IMG/leaderboards_icon.png"
                                    alt="Leaderboards for OpenGuessr">
                            </button>
                            <button id="enterButton${id}" style="${displayEnterButton}" class="standardButton competitionButton primaryButton${dailyPrimary}">Enter</button>
                        </div>
    `;

    container.appendChild(competitionItem);

    document.getElementById("host" + competitionHostIdCounter).addEventListener("click", () => {
      let id = authorId == 0 ? 2 : authorId; // if hosted by id 0 (system), set profile to PaulPlay
      loadProfileFromId(id, true);
    });

    const leaderboardButton = document.getElementById("leaderboardButton" + id);
    const enterButton = document.getElementById("enterButton" + id);
    const aboutItem = document.getElementById("aboutItem" + id);

    leaderboardButton.addEventListener("click", () => {
      openLeaderboard(id);
    });

    aboutItem.addEventListener("click", () => {
      showConfirmPopup("About", description, false, false, false, true);
    });

    enterButton.addEventListener("click", () => {
      if (localStorage.getItem("username") != null && localStorage.getItem("id") != null) {
        showConfirmPopup(
          "Enter " + name + "?",
          "This will start the game immediately. You can only enter a competition once.",
          () => {
            enterCompetition(id, localStorage.getItem("bearer"));
          },
        );
      } else {
        window.location.href = "/signup.html";
      }
    });

    if (entered) {
      enterButton.style.pointerEvents = "none";
      enterButton.style.opacity = "0.5";
      enterButton.textContent = "Already entered";
    } else if (authorId == localStorage.getItem("id")) {
      enterButton.style.pointerEvents = "none";
      enterButton.style.opacity = "0.5";
      enterButton.textContent = "Hosted by you";
    }

    setTimeout(() => {
      competitionItem.style.opacity = "1";
    }, 50);
  }

  // Open leaderboard and Enter competition ------------------------------------------------------------------------------------------------------
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

          localStorage.setItem("competition", JSON.stringify(activeCompetitionDetails));

          // go back to main page and start competition
          if (inIframe()) {
            window.parent.postMessage("close", "*");
            window.parent.postMessage("loadCompetition", "*");
          } else {
            window.location.href = "/index.html";
          }
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

          document.getElementById("enterText").textContent = "Error: " + errorMessages.join(" ");
        } catch {
          document.getElementById("enterText").textContent = "Error did not include json error string.";
        }
      }
    } catch (error) {
      console.error("Error occurred during competition details fetch ", error);
      document.getElementById("enterText").textContent = "Error: " + error;
    }
  }

  // Leaderboard ---------------------------------------------------------------------------------------------------------
  let leaderboardCompetitionId;

  function openLeaderboard(id) {
    leaderboardCompetitionId = id;
    document.getElementById("leaderboardPopup").style.display = "flex";
    document.getElementById("leaderboardHeader").textContent = "Results loading...";

    // load data from endpoint using id here
    document.getElementById("rankingDisplay").innerHTML = `<p>Loading...</p>`;
    loadLeaderboardFromServer(id);

    if (showRatingBox) {
      displayRatingBox();
      showRatingBox = false;
    }
  }

  document.getElementById("leaderboardClose").addEventListener("click", () => {
    document.getElementById("ratingBox").style.display = "none";
    document.getElementById("leaderboardPopup").style.display = "none";
  });

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
        try {
          const data = await response.json();
          document.getElementById("rankingDisplay").innerHTML = "";

          // add yourself at top with margin to others if you have played
          let youItem = data.userRank;

          if (youItem) {
            let youBar = document.createElement("div");
            youBar.classList.add("youBar");
            youBar.classList.add("bottomMarginItem");

            let newEntry = document.createElement("div");
            newEntry.classList.add("rankItem");

            if (youItem.supporter_level && youItem.supporter_level > 0) {
              newEntry.classList.add("leaderboardSupporterEntry");
            }

            newEntry.innerHTML = `
                        <p class="leaderboardTextEntry">#${youItem.position}</p>
                        <p id="yourUsername" class="leaderboardTextEntry centerEntry">${youItem.userName}</p>
                        <p class="leaderboardTextEntry">${youItem.score.toLocaleString()} Pts.</p>`;
            youBar.innerHTML = `
                        <p class="youLabel">You:</p>
                    `;

            youBar.appendChild(newEntry);
            document.getElementById("rankingDisplay").appendChild(youBar);
            document.getElementById("yourUsername").addEventListener("click", () => {
              loadProfileFromId(id, true);
            });
          }

          let idCounter = 0;

          data.leaderboard.forEach((entry) => {
            idCounter++;

            let newEntry = document.createElement("div");
            newEntry.classList.add("rankItem");

            if (entry.supporter_level && entry.supporter_level > 0) {
              newEntry.classList.add("leaderboardSupporterEntry");
            }

            newEntry.innerHTML = `
                        <p class="leaderboardTextEntry">#${entry.position}</p>
                        <p id="entry${idCounter}" class="leaderboardTextEntry centerEntry">${entry.userName}</p>
                        <p class="leaderboardTextEntry">${entry.score.toLocaleString()} Pts.</p>`;

            if (entry.id == localStorage.getItem("id")) {
              newEntry.classList.add("rankYou");
            }

            document.getElementById("rankingDisplay").appendChild(newEntry);

            document.getElementById("entry" + idCounter).addEventListener("click", () => {
              loadProfileFromId(id, true);
            });
          });

          document.getElementById("leaderboardHeader").textContent = "Results for " + data.name;
        } catch (error) {
          console.error("Error during the leaderboard loading and add process: " + error);
        }

        if (document.getElementById("rankingDisplay").innerHTML == "") {
          document.getElementById("rankingDisplay").innerHTML = `<p>No entries yet.</p>`;
        }
      } else {
        let responseData = null;

        try {
          responseData = await response.json();

          let errorMessages = [];

          if (responseData.error) {
            errorMessages.push(responseData.error);
          }

          if (responseData.message) {
            errorMessages.push(responseData.message);
          }

          if (responseData.errors && Array.isArray(responseData.errors)) {
            responseData.errors.forEach((err) => {
              if (err.msg) {
                errorMessages.push(err.msg);
              } else {
                errorMessages.push(JSON.stringify(err));
              }
            });
          }

          document.getElementById("rankingDisplay").innerHTML = `<p>Error: ${errorMessages.join(" ")}</p>`;
        } catch {
          document.getElementById("rankingDisplay").innerHTML = `<p>Error: Error did not include json.</p>`;
        }
      }
    } catch (error) {
      console.error("Error occurred during competition submission: ", error);
      document.getElementById("rankingDisplay").innerHTML = `<p>Error: ${error}</p>`;
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
        showRatingBox = true;
        openLeaderboard(leaderboardIdFromLinkAfterSubmit);
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

  function loadCompetitions() {
    getCompetitionsFromServer(false, undefined, true); // get daily comp
    getCompetitionsFromServer(false); // get initial 10 active comps
    getCompetitionsFromServer(true); // get initial 10 expired comps
  }

  loadCompetitions();

  // competition notEntered filter
  let hideEntered = false;
  document.getElementById("hideEntered").addEventListener("click", () => {
    hideEntered = !hideEntered;

    if (hideEntered) {
      document.getElementById("hideEntered").classList.add("hideEnteredActive");
    } else {
      document.getElementById("hideEntered").classList.remove("hideEnteredActive");
    }

    notExpiredIndex = 0; // reset index if starting new search
    document.getElementById("competitionArea").innerHTML = ""; // reset html of competition area
    getCompetitionsFromServer(false, undefined, undefined, hideEntered);
  });

  document.getElementById("loadMoreActive").addEventListener("click", () => {
    getCompetitionsFromServer(false, undefined, undefined, hideEntered);
  });

  document.getElementById("loadMoreExpired").addEventListener("click", () => {
    getCompetitionsFromServer(true);
  });

  async function getCompetitionsFromServer(expired, search, daily, filterEntered) {
    // display initial loading message
    if (!firstLoad) {
      document.querySelectorAll(".errorText").forEach((e) => {
        e.textContent = "Loading competitions...";
      });

      firstLoad = true;
    }

    try {
      let requestBody = {
        id: localStorage.getItem("id"), // if this is null, that is fine too. This is used to evaluate whether a user has already played certain competitions.
      };

      if (search) requestBody.search = search;

      let Endpoint = null;

      if (!expired) {
        Endpoint = competitionsEndpoint + "/" + notExpiredIndex;
      } else {
        Endpoint = competitionsEndpoint + "/expired/" + expiredIndex;
      }

      // always hide load more bar during loading process
      if (!expired) {
        document.getElementById("loadMoreActive").style.display = "none";
      } else {
        document.getElementById("loadMoreExpired").style.display = "none";
      }

      // if a search query is passed, use the search endpoint
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
          data.competitions.forEach((competition) => {
            addCompetition(
              competition.id,
              competition.name,
              competition.author,
              competition.author_id,
              competition.playercount,
              competition.restriction,
              competition.duration,
              competition.remainingDuration,
              competition.location_amount,
              competition.round_length,
              competition.description,
              competition.expired,
              competition.entered,
              daily,
            );
            noContentLoaded = false;

            if (!daily) {
              if (!expired) {
                notExpiredIndex += 1;
              } else {
                expiredIndex += 1;
              }
            }
          });

          let maxAmountLoaded = data.competitions.length == 10;

          if (!daily) {
            if (expired) {
              document.getElementById("loadMoreExpired").style.display = maxAmountLoaded ? "block" : "none";
            } else {
              document.getElementById("loadMoreActive").style.display = maxAmountLoaded ? "block" : "none";
            }
          }

          if (search && noContentLoaded && notExpiredIndex == 0) {
            document.getElementById("competitionArea").innerHTML =
              `<p class="errorText">Search returned no results.</p>`;
          }

          if (!daily && !search && !expired && noContentLoaded && notExpiredIndex == 0) {
            document.getElementById("competitionArea").innerHTML =
              `<p class="errorText">No active competitions found.</p>`;
          }

          if (!daily && !search && expired && noContentLoaded && expiredIndex == 0) {
            document.getElementById("expiredCompetitionArea").innerHTML =
              `<p class="errorText">No expired competitions found.</p>`;
          }

          if (daily && !expired && !search && noContentLoaded) {
            document.getElementById("dailyCompetitionArea").innerHTML =
              `<p class="errorText">There currently is no daily competition. Wait shortly, as it's likely being created right now.</p>`;
          }
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
      console.error("Error occurred during competition submission: ", error);
      return "A network error has occurred.";
    }
  }

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

  function displayRatingBox() {
    document.getElementById("ratingBox").style.display = "flex";
    document.getElementById("ratingButtonBox").style.display = "";
    document.getElementById("ratingText").textContent = "Rate this competition";
  }

  document.getElementById("rateGood").addEventListener("click", () => submitRating(5));
  document.getElementById("rateBad").addEventListener("click", () => submitRating(-3));
  document.getElementById("rateBroken").addEventListener("click", () => submitRating(-10));

  async function submitRating(factor) {
    document.getElementById("ratingButtonBox").style.display = "none";
    document.getElementById("ratingText").textContent = "Rating...";

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
        document.getElementById("ratingText").textContent = error;
      } else {
        document.getElementById("ratingText").textContent = "Rating received, thank you!";
      }
    } catch (error) {
      console.error("A network error occured submitting the competition rating: " + error);
      document.getElementById("ratingText").textContent = "Network error";
    }
  }
</script>

<div id="leaderboardPopup" class="popupHolder">
  <div id="leaderboardWindow" class="uiWindow">
    <h1 id="leaderboardHeader" class="textHeaderLeft">Ranking for DefaultMap</h1>
    <div id="rankingDisplay" class="rankingDisplay">
      <div class="rankItem">
        <p>#1</p>
        <p>DefaultUser1</p>
        <p>15 Pts.</p>
      </div>
      <div class="rankItem rankYou">
        <p>#2</p>
        <p>DefaultUser2</p>
        <p>10 Pts.</p>
      </div>
      <div class="rankItem">
        <p>#2</p>
        <p>DefaultUser3</p>
        <p>5 Pts.</p>
      </div>
    </div>
    <div id="ratingBox">
      <p id="ratingText">Rate this competition (Default)</p>
      <div class="ratingButtonBox" id="ratingButtonBox">
        <button class="standardButton rateButton" id="rateGood">
          <img class="ratingIcon" alt="good" src="/img/rating_good_icon.png" />
        </button>
        <button class="standardButton rateButton" id="rateBad">
          <img class="ratingIcon" alt="bad" src="/img/rating_bad_icon.png" />
        </button>
        <button class="standardButton rateButton" id="rateBroken">
          <img class="ratingIcon" alt="broken" src="/img/rating_broken_icon.png" />
        </button>
      </div>
    </div>
    <div class="buttonBox popupButtons">
      <button id="leaderboardClose" class="standardButton popupButton closeButton">Close</button>
    </div>
  </div>
</div>
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
        <p class="errorText">Please wait...</p>
      </div>
    </div>
    <div class="competitionElement competitionBox">
      <div class="flexCompetitionBar competitionElement competitionTitle">
        <h2 class="boxHeader">Currently ongoing:</h2>
        <search>
          <button id="hideEntered" class="standardButton searchBarButton">Hide entered</button>
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
        <p class="errorText">Please wait...</p>
      </div>
      <button id="loadMoreActive" class="loadMore standardButton">Show more ▼</button>
    </div>
    <div class="competitionElement competitionBox expiredBox">
      <div class="competitionElement competitionTitle competitionTitleExpired">
        <h2 class="boxHeader">Recently ended:</h2>
      </div>
      <div id="expiredCompetitionArea" class="center competitionArea">
        <!-- expired competitions will be inserted here -->
        <p class="errorText">Please wait...</p>
      </div>
      <button id="loadMoreExpired" class="loadMore standardButton">Show more ▼</button>
    </div>
  </div>
</div>

<svelte:head>
  <title>Competitions</title>
</svelte:head>

<style>
  .faqItem {
    margin-bottom: 15px;
    background-color: rgba(255, 210, 210, 0.15);
    border-radius: 5px;
    padding: 10px;
    padding-inline: 20px;
    padding-inline-end: 30px;
    min-width: 50%;
    list-style: none;
  }

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

  .spacer {
    height: 15px;
    width: 100%;
  }

  .competitionHeader {
    text-align: left;
    font-size: 30px;
  }

  .explainElement {
    background-color: rgba(20, 22, 38, 0.9);
    height: auto;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .explainElement:hover {
    filter: none !important;
  }

  .listIcon {
    width: 20px;
    height: 20px;
    margin-right: 10px;
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

  .buttonBox {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
    flex-wrap: wrap;
  }

  .popupHolder {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(12, 12, 12, 0.75);
    z-index: 100;
  }

  .primaryButton {
    background-color: rgb(181, 63, 63);
  }

  .textIcon {
    width: 25px;
    height: 25px;
    vertical-align: -2px;
  }

  .popupButtons {
    gap: 20px;
    margin-top: 40px;
  }

  .popupButton {
    margin-right: -12px;
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
  }

  .rankingDisplay {
    display: flex;
    justify-content: safe center;
    flex-direction: column;
    width: calc(100% - 40px);
    border-radius: 5px;
    max-height: 50vh;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: none;
    padding: 20px;
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

  .infoNoteBox {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    padding: 10px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    padding-inline: 30px;
  }

  #inputArea {
    padding: 10px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
  }

  .uploadInfo {
    border-radius: 10px;
    outline: none;
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    width: 75%;
    font-size: 22px;
    min-height: 30px;
    font-family: Barlow;
    border: none;
    padding: 5px;
    padding-inline: 20px;
    margin-bottom: 20px;
    margin-top: 10px;
    transition: background-color 250ms ease;
  }

  .uploadInfo:focus {
    background-color: rgba(255, 255, 255, 0.2);
  }

  #infoNoteIcon {
    width: 35px;
    height: 35px;
    margin-bottom: 20px;
    margin-top: 7px;
    opacity: 0.5;
    margin-left: -10px;
  }

  pre {
    font-family: monospace;
    white-space: pre-wrap;
    font-size: 15px;
  }

  .locationTextbox {
    min-height: 350px;
    font-size: 12px;
    width: 90%;
    padding: 15px;
  }

  .helpItem {
    margin-bottom: 10px;
  }

  .verticalMarginUl {
    margin-top: 25px;
    margin-bottom: 25px;
    margin-left: 40px;
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

  .metricEnd {
    margin-left: 10px;
    margin-top: 19px;
  }

  .extendedInputBox {
    display: flex;
  }

  .marginBottom {
    margin-bottom: 20px;
  }

  .toggleButton {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    margin-bottom: 20px;
    margin-top: 10px;
    border-radius: 10px;
    min-width: 190px;
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
    /* centers it */
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

  .fadeInItem {
    opacity: 0;
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

  .linkField {
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 5px;
    margin-top: 5px;
  }

  .linkButtonSubmit {
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 0.3);
    padding: 10px;
    min-width: 250px;
    margin: 0;
    margin-top: 20px;
    width: 100%;
  }

  .linkBox {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px;
    width: calc(100% - 20px);
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

  .shiftedButtonBox {
    width: calc(100% + 13px);
  }

  .directionArrowIcon {
    width: 25px;
    height: 25px;
    filter: invert();
    transform: rotate(90deg);
    vertical-align: -4px;
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
    display: none;
    /* changed to flex in code */
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

    .competitionHeader {
      font-size: 22px;
    }

    .competitionItemHeader {
      font-size: 27px;
    }

    .label p {
      font-size: 18px;
    }
  }
</style>
