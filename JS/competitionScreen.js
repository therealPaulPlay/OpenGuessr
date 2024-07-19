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

// add competitions programmatically ---------------------------------------------------------------

let normalAddSuccessful = false;
let expiredAddSuccessful = false;

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

function addCompetition(id, name, author, playercount, restriction, duration, remainingDuration, locationAmount, roundLength, description, expired, entered) {
    let container = expired ? document.getElementById("expiredCompetitionArea") : document.getElementById("competitionArea");

    // clean container on load of first competition for each one. 
    if (!expired && !normalAddSuccessful) {
        container.innerHTML = "";
        normalAddSuccessful = true;
    }

    if (expired && !expiredAddSuccessful) {
        container.innerHTML = "";
        expiredAddSuccessful = true;
    }

    let displayEnterButton = expired ? "display: none;" : "";
    let expiredItem = expired ? " expiredCompetitionColor" : "";
    let expiredLeaderboardButton = expired ? " expiredLeaderboardColor" : "";

    let competitionItem = document.createElement("div");
    competitionItem.className = `competitionItem${expiredItem}`;

    competitionItem.innerHTML = `
                        <h2 class="competitionItemHeader">${name}</h2>
                        <p class="competitionAuthor">hosted by ${author}</p>
                        <div class="competitionPropertiesBox">
                            <div class="propertyItem${expiredItem}">
                                <div class="label${expiredItem}">
                                    <p>Plays</p>
                                </div>
                                <p class="itemText">${playercount}</p>
                            </div>
                            <div class="propertyItem${expiredItem}">
                                <div class="label${expiredItem}">
                                    <p>Restriction</p>
                                </div>
                                <p class="itemText">${restriction}</p>
                            </div>
                            <div class="propertyItem${expiredItem}">
                                <div class="label${expiredItem}">
                                    <p>Duration</p>
                                </div>
                                <p class="itemText">${formatDuration(duration)} (${formatDuration(remainingDuration)} left)</p>
                            </div>
                            <div class="propertyItem${expiredItem}">
                                <div class="label${expiredItem}">
                                    <p>Rounds</p>
                                </div>
                                <p class="itemText">${locationAmount}</p>
                            </div>
                            <div class="propertyItem${expiredItem}">
                                <div class="label${expiredItem}">
                                    <p>Round length</p>
                                </div>
                                <p class="itemText">${roundLength}s</p>
                            </div>
                        </div>
                        <div class="competitionDesc${expiredItem}">
                            <div class="label${expiredItem}">
                                <p>About</p>
                            </div>
                            <p class="itemText descText">${description}</p>
                        </div>
                        <div class="buttonBox competitionButtonBox">
                            <button id="leaderboardButton${id}" class="standardButton competitionButton leftButton${expiredLeaderboardButton}">Results
                                <img class="textIcon invert" src="/IMG/leaderboards_icon.png"
                                    alt="Leaderboards for OpenGuessr">
                            </button>
                            <button id="enterButton${id}" style="${displayEnterButton}" class="standardButton competitionButton primaryButton">Enter</button>
                        </div>
    `;

    container.appendChild(competitionItem);

    const leaderboardButton = document.getElementById("leaderboardButton" + id);
    const enterButton = document.getElementById("enterButton" + id);

    leaderboardButton.addEventListener("click", () => {
        openLeaderboard(id, name);
    });

    enterButton.addEventListener("click", () => {
        enterCompetitionPopup(id, name);
    });

    if (entered) {
        enterButton.style.pointerEvents = "none";
        enterButton.style.opacity = "0.5";
        enterButton.textContent = "Already entered";
    }
}


// Open leaderboard and enter competition ------------------------------------------------------------------------------------------------------

function openLeaderboard(id, name) {
    document.getElementById("leaderboardPopup").style.display = "flex";
    document.getElementById("leaderboardHeader").textContent = "Results for " + name;

    // load data from endpoint using id here
    document.getElementById("rankingDisplay").innerHTML = `<p>Loading...</p>`;
    loadLeaderboardFromServer(id);
}

function enterCompetitionPopup(id, name) {
    document.getElementById("enterPopup").style.display = "flex";
    document.getElementById("enterHeader").textContent = "Enter " + name + "?";

    // save details in localstorage here, make api call to get locations and other data like restrictions
}

document.getElementById("enterClose").addEventListener("click", () => {
    document.getElementById("enterPopup").style.display = "none";
});

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
                    let newEntry = document.createElement("div");
                    newEntry.classList.add("rankItem");
                    newEntry.classList.add("bottomMarginItem");
                    newEntry.innerHTML = `
                        <p>#${youItem.position}</p>
                        <p>${youItem.userName}</p>
                        <p>${youItem.score.toLocaleString()} Pts.</p>`;

                    document.getElementById("rankingDisplay").appendChild(newEntry);
                }

                data.leaderboard.forEach(entry => {
                    let newEntry = document.createElement("div");
                    newEntry.classList.add("rankItem");
                    newEntry.innerHTML = `
                        <p>#${entry.position}</p>
                        <p>${entry.userName}</p>
                        <p>${entry.score.toLocaleString()} Pts.</p>`;

                    if (entry.id == localStorage.getItem("id")) {
                        newEntry.classList.add("rankYou");
                    }

                    document.getElementById("rankingDisplay").appendChild(newEntry);
                });

            } catch (error) {
                console.error("Error during the competition loading and add process: " + error);
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

// load competitions --------------------------------------------------------------------------------------
let notExpiredIndex = 0;
let expiredIndex = 0;

function loadCompetitions() {
    getCompetitionsFromServer(false); // get initial 10 active comps
    getCompetitionsFromServer(true); // get initial 10 expired comps
}

loadCompetitions();

async function getCompetitionsFromServer(expired) {
    try {
        const requestBody = {
            id: localStorage.getItem("id") // if this is null, that is fine too. This is used to evaluate whether a user has already played certain competitions.
        };

        let Endpoint = null;

        if (!expired) {
            Endpoint = competitionsEndpoint + "/" + notExpiredIndex;
        } else {
            Endpoint = competitionsEndpoint + "/expired/" + expiredIndex;
        }
        const response = await fetch(Endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            try {
                const data = await response.json();
                data.competitions.forEach(competition => {
                    addCompetition(competition.id, competition.name, competition.author, competition.playercount, competition.restriction, competition.duration, competition.remainingDuration, competition.location_amount, competition.round_length, competition.description, competition.expired, competition.entered);

                    if (!expired) {
                        notExpiredIndex += 10;
                    } else {
                        expiredIndex += 10;
                    }
                });
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

// Create window -------------------------------------------------------------------------------------------

let competitionSubmittedSuccessfully = false;

document.getElementById("createButton").addEventListener("click", () => {
    openCreateWindow();
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
document.getElementById("submitConfirm").addEventListener("click", async () => {
    document.getElementById("submitConfirm").style.display = "none";
    let operationMessage = await submitCompetition(localStorage.getItem("bearer"), document.getElementById("uploadCompetitionName").value, localStorage.getItem("username"), localStorage.getItem("id"),
        competitionRestriction, convertToSeconds(document.getElementById("uploadCompetitionDuration").value),
        convertToSeconds(document.getElementById("uploadCompetitionRoundLength").value), document.getElementById("uploadCompetitionDescription").value, extractCoordinates(document.getElementById("uploadLocationData").value));

    document.getElementById("submitConfirmText").textContent = operationMessage;
    if (operationMessage.includes("success")) {
        document.getElementById("submitConfirmHeader").textContent = "Competition created!";
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

// Toggle Restrictions ---------------------------------------------------------------------------------------------

let toggleRestrictions = document.getElementById("uploadCompetitionRestriction");

toggleRestrictions.addEventListener("click", () => {
    togglecompetitionRestriction();
});

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

async function submitCompetition(token, name, author, authorId, restriction, duration, roundLength, description, rawLocations) {
    try {
        const requestBody = {
            name: name,
            author: author,
            id: authorId,
            restriction: restriction,
            duration: duration,
            roundLength: roundLength,
            description: description,
            rawLocations: rawLocations
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
            return "Competition created successfully! Thank you for contributing.";
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

