const competitionsEndpoint = "https://competitions.openguessr.com/competitions";

// Return button logic ------------------------------------------------------------------------
function inIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

document.getElementById("backButton").addEventListener("click", () => {
    if (inIframe()) {
        window.top.postMessage("close", "*");
    } else {
        window.location.href = "/index.html";
    }
});

// FAQ expand / collapse -------------------------------------------------------------------------
document.getElementById("toggleFaqButton").addEventListener("click", (e) => {
    toggleSection(e);
});
document.getElementById("toggleFaqBar").addEventListener("click", (e) => {
    toggleSection(e);
});

let faqToggled = false;

function toggleSection(e) {
    e.stopPropagation();

    let contentSection = document.getElementById("contentSection");
    let toggleButton = document.getElementById("toggleFaqButton");

    if (!faqToggled) {
        contentSection.style.maxHeight = "1000px";
        toggleButton.textContent = "-";
    } else {
        contentSection.style.maxHeight = "0px";
        toggleButton.textContent = "+";
    }

    faqToggled = !faqToggled;
}

// open profiles -----------------------------------------------------------------------------------

function openProfile(id) {
    if (inIframe()) {
        window.top.postMessage("profile" + id, "*");
    } else {
        window.location.href = "/index.html?profile=" + id;
    }
}

// add competitions programmatically ---------------------------------------------------------------

let normalAddSuccessful = false;
let expiredAddSuccessful = false;
let firstLoad = false;

function formatDuration(seconds) {
    if (typeof seconds === 'string') {
        seconds = parseInt(seconds, 10);
    }

    if (isNaN(seconds) || seconds < 0) {
        return "0min";
    }

    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);

    let result = [];
    if (days > 0) result.push(`${days}d`);
    if (hours > 0) result.push(`${hours}h`);
    if (minutes > 0 || result.length === 0) result.push(`${minutes}min`);

    return result.join(' ');
}

let competitionHostIdCounter = 0;

function addCompetition(id, name, author, authorId, playercount, restriction, duration, remainingDuration, locationAmount, roundLength, description, expired, entered, daily) {
    let container = expired ? document.getElementById("expiredCompetitionArea") : document.getElementById("competitionArea");

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
        openProfile(id);
    });

    const leaderboardButton = document.getElementById("leaderboardButton" + id);
    const enterButton = document.getElementById("enterButton" + id);
    const aboutItem = document.getElementById("aboutItem" + id);

    leaderboardButton.addEventListener("click", () => {
        openLeaderboard(id);
    });

    aboutItem.addEventListener("click", () => {
        openDescriptionWindow(description);
    })

    enterButton.addEventListener("click", () => {
        if (localStorage.getItem("username") != null && localStorage.getItem("id") != null) {
            enterCompetitionPopup(id, name);
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

// extend. Description window -------------------------------------------------------------------------------------------------------

function openDescriptionWindow(text) {
    document.getElementById("aboutText").textContent = text;
    document.getElementById("descriptionPopup").style.display = "flex";
}

document.getElementById("aboutClose").addEventListener("click", () => {
    document.getElementById("descriptionPopup").style.display = "none";
});

// Open leaderboard and Enter competition ------------------------------------------------------------------------------------------------------

let currentEnterID = null;

function enterCompetitionPopup(id, name) {
    document.getElementById("enterPopup").style.display = "flex";
    document.getElementById("enterHeader").textContent = "Enter " + name + "?";
    document.getElementById("enterText").textContent = "This will start the game immediately. You can only enter a competition once. Continue?";
    currentEnterID = id;
}

document.getElementById("enterClose").addEventListener("click", () => {
    document.getElementById("enterPopup").style.display = "none";
});

document.getElementById("enterConfirm").addEventListener("click", () => {
    document.getElementById("enterText").textContent = "Requesting competition details from server...";
    enterCompetition(currentEnterID, localStorage.getItem("bearer"));
})

async function enterCompetition(id, token) {
    try {
        const requestBody = {
            id: localStorage.getItem("id") // if this is null, that is fine too. This is used to evaluate whether a user has already played certain competitions.
        };

        const response = await fetch(competitionsEndpoint + "/details/" + id, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            try {
                const data = await response.json();

                document.getElementById("enterText").textContent = "Details received from server. Starting...";
                let activeCompetitionDetails = {
                    name: data.name,
                    id: data.id,
                    roundAmount: data.location_amount,
                    roundLength: data.round_length,
                    restriction: data.restriction,
                    locations: data.locations.locations
                }

                localStorage.setItem("competition", JSON.stringify(activeCompetitionDetails));

                // go back to main page and start competition
                if (inIframe()) {
                    window.top.postMessage("close", "*");
                    window.top.postMessage("loadCompetition", "*");
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

                if (responseData.error) {
                    errorMessages.push(responseData.error);
                }

                if (responseData.message) {
                    errorMessages.push(responseData.message);
                }

                if (responseData.errors && Array.isArray(responseData.errors)) {
                    responseData.errors.forEach(err => {
                        if (err.msg) {
                            errorMessages.push(err.msg);
                        } else {
                            errorMessages.push(JSON.stringify(err));
                        }
                    });
                }

                document.getElementById("enterText").textContent = "Error: " + errorMessages.join(' ');
            } catch {
                document.getElementById("enterText").textContent = "Error did not include json error string.";
            }
        }
    } catch (error) {
        console.error('Error occurred during competition details fetch ', error);
        document.getElementById("enterText").textContent = "Error: " + error;
    }
}


// Leaderboard ---------------------------
function openLeaderboard(id) {
    document.getElementById("leaderboardPopup").style.display = "flex";
    document.getElementById("leaderboardHeader").textContent = "Results loading...";

    // load data from endpoint using id here
    document.getElementById("rankingDisplay").innerHTML = `<p>Loading...</p>`;
    loadLeaderboardFromServer(id);
}

document.getElementById("leaderboardClose").addEventListener("click", () => {
    document.getElementById("leaderboardPopup").style.display = "none";
});

async function loadLeaderboardFromServer(id) {
    try {
        const requestBody = {
            id: localStorage.getItem("id") // if this is null, that is fine too. This is used to evaluate whether a user has already played certain competitions.
        };

        const response = await fetch(competitionsEndpoint + "/leaderboard/" + id, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
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
                        openProfile(localStorage.getItem("id"));
                    });
                }

                let idCounter = 0;

                data.leaderboard.forEach(entry => {
                    idCounter ++;

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
                        openProfile(entry.id);
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
                    responseData.errors.forEach(err => {
                        if (err.msg) {
                            errorMessages.push(err.msg);
                        } else {
                            errorMessages.push(JSON.stringify(err));
                        }
                    });
                }

                document.getElementById("rankingDisplay").innerHTML = `<p>Error: ${errorMessages.join(' ')}</p>`;
            } catch {
                document.getElementById("rankingDisplay").innerHTML = `<p>Error: Error did not include json.</p>`;
            }
        }
    } catch (error) {
        console.error('Error occurred during competition submission: ', error);
        document.getElementById("rankingDisplay").innerHTML = `<p>Error: ${error}</p>`;
    }
}

// Query Links - enter and load leaderboard --------------------------------------------------------------------------------------------------------
// open leaderboard via link
let urlParams = new URLSearchParams(window.location.search);

let leaderboardIdFromLink;

try {
    leaderboardIdFromLink = urlParams.get("leaderboard");
    if (leaderboardIdFromLink) {
        openLeaderboard(leaderboardIdFromLink);
        history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
    }
} catch { }

// enter competition via link
let competitionIdFromLink;

try {
    competitionIdFromLink = urlParams.get("enter");
    if (competitionIdFromLink) {
        enterCompetitionPopup(competitionIdFromLink, "Competition from Link");
        history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
    }
} catch { }

// load competitions ----------------------------------------------------------------------------------------------------------------------------
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
            id: localStorage.getItem("id") // if this is null, that is fine too. This is used to evaluate whether a user has already played certain competitions.
        };

        if (search) {
            requestBody.search = search;
        }


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
        if (search) {
            Endpoint = competitionsEndpoint + "/search/" + notExpiredIndex;
        }

        if (daily) {
            Endpoint = competitionsEndpoint + "/daily/daily-competition";
        }

        if (filterEntered) {
            Endpoint = competitionsEndpoint + "/notentered/" + notExpiredIndex;
        }

        const response = await fetch(Endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            let noContentLoaded = true;

            try {
                const data = await response.json();
                data.competitions.forEach(competition => {
                    addCompetition(competition.id, competition.name, competition.author, competition.author_id, competition.playercount, competition.restriction, competition.duration, competition.remainingDuration, competition.location_amount, competition.round_length, competition.description, competition.expired, competition.entered, daily);
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
                    document.getElementById("competitionArea").innerHTML = `<p class="errorText">Search returned no results.</p>`;
                } 

                if (!daily && !search && !expired && noContentLoaded && notExpiredIndex == 0) {
                    document.getElementById("competitionArea").innerHTML = `<p class="errorText">No active competitions found.</p>`;
                } 
                
                if (!daily && !search && expired && noContentLoaded && expiredIndex == 0) {
                    document.getElementById("expiredCompetitionArea").innerHTML = `<p class="errorText">No expired competitions found.</p>`;
                } 
                
                if (daily && !expired && !search && noContentLoaded) {
                    document.getElementById("dailyCompetitionArea").innerHTML = `<p class="errorText">There currently is no daily competition. Wait shortly, as it's likely being created right now.</p>`;
                }

            } catch (error) {
                console.error("Error during the competition loading and add process: " + error);
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
                    responseData.errors.forEach(err => {
                        if (err.msg) {
                            errorMessages.push(err.msg);
                        } else {
                            errorMessages.push(JSON.stringify(err));
                        }
                    });
                }

                document.querySelectorAll(".errorText").forEach((e) => {
                    e.textContent = "Error: " + errorMessages.join(' ');
                });

            } catch {
                document.querySelectorAll(".errorText").forEach((e) => {
                    e.textContent = "Error did not include json.";
                });
            }
        }
    } catch (error) {
        console.error('Error occurred during competition submission: ', error);
        return "A network error has occurred.";
    }
}

// Search Competitions -------------------------------------------------------------------------------------------------

// search with enter key
document.getElementById("competitionSearch").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
    };
});

document.getElementById("competitionSearch").addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        startSearch();
    };
});

document.getElementById("startSearch").addEventListener("click", startSearch);

function startSearch() {
    let query = document.getElementById("competitionSearch").value.toLowerCase();
    if (hideEntered) {
        document.getElementById("hideEntered").classList.remove("hideEnteredActive");
        hideEntered = false;
    }
    notExpiredIndex = 0; // reset index if starting new search
    document.getElementById("competitionArea").innerHTML = ""; // reset html of competition area

    if (query == "") {
        query = undefined; // so the undefined check works in the load function
    }

    getCompetitionsFromServer(false, query);
}

// Create window -------------------------------------------------------------------------------------------

let competitionSubmittedSuccessfully = false;

document.getElementById("createButton").addEventListener("click", () => {
    if (localStorage.getItem("username") != null && localStorage.getItem("id") != null) {
        openCreateWindow();
    } else {
        window.location.href = "/signup.html";
    }
});

document.getElementById("uploadClose").addEventListener("click", () => {
    closeCreateWindow();
});

function closeCreateWindow() {
    document.getElementById("uploadPopup").style.display = "none";
}

function openCreateWindow() {
    document.getElementById("uploadPopup").style.display = "flex";
    document.getElementById("createWindow").scrollTop = "0";
    document.getElementById("uploadPopup").scrollTop = "0";
}

function showConfirmPopup() {
    document.getElementById("submitConfirmPopup").style.display = "flex";
    document.getElementById("submitConfirmText").textContent = "Submitted competitions cannot be edited or deleted! Violating the rules can result in a permanent ban.";
    document.getElementById("submitConfirmHeader").textContent = "Are you sure?";
    document.getElementById("submitConfirm").style.display = "block";
}

function closeConfirmPopup() {
    if (competitionSubmittedSuccessfully) {
        window.location.reload();
    } else {
        document.getElementById("submitConfirmPopup").style.display = "none";
    }
}

document.getElementById("uploadConfirm").addEventListener("click", showConfirmPopup);
document.getElementById("submitConfirmClose").addEventListener("click", closeConfirmPopup);

// submit with all details
let competitionCreationId;

document.getElementById("submitConfirm").addEventListener("click", async () => {
    document.getElementById("submitConfirm").style.display = "none";
    let operationMessage = await submitCompetition(localStorage.getItem("bearer"), document.getElementById("uploadCompetitionName").value, localStorage.getItem("username"), localStorage.getItem("id"),
        competitionRestriction, convertToSeconds(document.getElementById("uploadCompetitionDuration").value),
        convertToSeconds(document.getElementById("uploadCompetitionRoundLength").value), document.getElementById("uploadCompetitionDescription").value, extractCoordinates(document.getElementById("uploadLocationData").value), competitionPrivate); // last one is private, has to be changed

    document.getElementById("submitConfirmText").textContent = operationMessage;
    if (operationMessage.includes("success")) {
        document.getElementById("submitConfirmHeader").textContent = "Competition created!";

        // create links
        const enterLink = window.location.origin + "/competitions.html?enter=" + competitionCreationId;
        const leaderboardLink = window.location.origin + "/competitions.html?leaderboard=" + competitionCreationId;

        let linkBox = document.createElement("div");
        linkBox.innerHTML = `
        <div class="spacer"></div>
        <div class="linkBox">
        <p>Enter link:</p>
        <p class="linkField">${enterLink}</p>
        <div class="spacer"></div>
        <p>Leaderboard link:</p>
        <p class="linkField">${leaderboardLink}</p>
        <button id="copyLinksButton" class="standardButton linkButtonSubmit">Click to copy both links</button>
        </div>
        `;

        document.getElementById("submitConfirmText").appendChild(linkBox);
        document.getElementById("copyLinksButton").addEventListener("click", () => {
            navigator.clipboard.writeText(enterLink + " " + leaderboardLink)
                .then(function () {
                    document.getElementById("copyLinksButton").textContent = "Copied!";
                    setTimeout(() => {
                        document.getElementById("copyLinksButton").textContent = "Click to copy both links";
                    }, 700);
                })
                .catch(function (error) {
                    document.getElementById("copyLinksButton").textContent = "Error!";
                    console.error("Copy error: " + error);
                    setTimeout(() => {
                        document.getElementById("copyLinksButton").textContent = "Click to copy both links";
                    }, 700);
                });
        })

    } else {
        document.getElementById("submitConfirmHeader").textContent = "Oh no! An error occured";
    }
});

// Get seconds from string time input -------------------------------------------------------------------------------

function convertToSeconds(input) {
    try {
        const pattern = /(\d+)\s*d|(\d+)\s*h|(\d+)\s*min|(\d+)\s*s|\d+/gi;
        let totalSeconds = 0;
        const matches = input.match(pattern);
        if (matches) {
            matches.forEach(match => {
                let value = parseInt(match);
                if (match.includes('d')) {
                    totalSeconds += value * 86400;
                } else if (match.includes('h')) {
                    totalSeconds += value * 3600;
                } else if (match.includes('min')) {
                    totalSeconds += value * 60;
                } else if (match.includes('s')) {
                    totalSeconds += value;
                } else {
                    totalSeconds += value;
                }
            });
        }
        return totalSeconds;
    } catch (error) {
        console.error("Error occured when extracting time seconds from inputs: " + error);
        return null;
    }
}

// Toggle Restrictions & Visibility ---------------------------------------------------------------------------------------------

let toggleRestrictions = document.getElementById("uploadCompetitionRestriction");
let toggleVisibility = document.getElementById("uploadCompetitionVisibility");

toggleRestrictions.addEventListener("click", () => {
    togglecompetitionRestriction();
});

toggleVisibility.addEventListener("click", toggleCompetitionVisibility);

let competitionPrivate = false;

function toggleCompetitionVisibility() {
    competitionPrivate = !competitionPrivate;

    if (competitionPrivate) {
        toggleVisibility.textContent = "Private";
    } else {
        toggleVisibility.textContent = "Public";
    }
}


let competitionRestriction = "standard";

let restrictions = ["standard", "nmpz", "grayscale", "invert", "hue", "fade"];
let currentRestrictionIndex = 0;

function togglecompetitionRestriction() {
    if (toggleRestrictions.textContent == "Standard") {
        currentRestrictionIndex = 1; // start from the first restriction after standard
    } else {
        currentRestrictionIndex = (currentRestrictionIndex + 1) % restrictions.length;
    }
    competitionRestriction = restrictions[currentRestrictionIndex];

    // Update the button text
    switch (competitionRestriction) {
        case "nmpz":
            toggleRestrictions.textContent = "No move (NMPZ)";
            break;
        case "grayscale":
            toggleRestrictions.textContent = "Grayscale";
            break;
        case "invert":
            toggleRestrictions.textContent = "Invert Colors";
            break;
        case "hue":
            toggleRestrictions.textContent = "Hue Shift";
            break;
        case "fade":
            toggleRestrictions.textContent = "Blink (Fade)";
            break;
        case "standard":
        default:
            toggleRestrictions.textContent = "Standard";
            break;
    }
}

// Submission function ------------------------------------------------------------------------------------------------------

// Convert streetview links to json file:
function extractCoordinates(text) {
    try {
        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/g;
        const coordinates = [];
        let match;

        while ((match = regex.exec(text)) !== null) {
            const lat = parseFloat(match[1]);
            const long = parseFloat(match[2]);
            coordinates.push([lat, long]);
        }

        // Wrap coordinates with the outer object
        const output = JSON.stringify({ locations: coordinates }, null, 2);

        return output;
    } catch (error) {
        console.error("Error in extractCoordinates: " + error);
    }
}

async function submitCompetition(token, name, author, authorId, restriction, duration, roundLength, description, rawLocations, private) {
    try {
        const requestBody = {
            name: name,
            author: author,
            id: authorId,
            restriction: restriction,
            duration: duration,
            roundLength: roundLength,
            description: description,
            rawLocations: rawLocations,
            private: private
        };

        const response = await fetch(competitionsEndpoint + "/create", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            document.getElementById("uploadPopup").style.display = "none";
            competitionSubmittedSuccessfully = true;
            try {
                const data = await response.json();
                competitionCreationId = data.competitionId;
            } catch (e) {
                console.error("Error extracting competitionId from creation response: " + e)
            }
            return "Competition created successfully. Good luck and have fun!";
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
                    responseData.errors.forEach(err => {
                        if (err.msg) {
                            errorMessages.push(err.msg);
                        } else {
                            errorMessages.push(JSON.stringify(err));
                        }
                    });
                }

                return errorMessages.join(' ');
            } catch {
                return "Error occured on server and response did not include a json response.";
            }
        }
    } catch (error) {
        console.error('Error occurred during competition submission: ', error);
        return "A network error has occurred.";
    }
}

