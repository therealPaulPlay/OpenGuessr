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
                                <p class="itemText">${duration} (${remainingDuration} left)</p>
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
    document.getElementById("leaderboardHeader").textContent = "Ranking for " + name;

    // load data from endpoint using id here
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

// load competitions --------------------------------------------------------------------------------------

function loadCompetitions() {
    // load from server, id has to be unique

    addCompetition(0, "Cool Comp", "Paul", 17, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", false, false);
    addCompetition(1, "Swaggy Comp", "Paul", 17, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", false, false);
    addCompetition(2, "Swaggy Comp", "Paul", 17, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", false, false);
    addCompetition(0, "Cool Comp", "Paul", 17, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", false, false);
    addCompetition(1, "Swaggy Comp", "Paul", 17, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", false, false);
    addCompetition(2, "Swaggy Comp", "Paul", 17, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", false, false);
    addCompetition(0, "Cool Comp", "Paul", 17, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", false, false);
    addCompetition(1, "Swaggy Comp", "Paul", 17, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", false, false);
    addCompetition(2, "Swaggy Comp", "Paul", 17, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", false, false);
    addCompetition(3, "Formerly cool Comp", "Paul", 55, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", true, false);
}

loadCompetitions();

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

document.getElementById("submitConfirm").addEventListener("click", async () => {
    let operationMessage = await submitCompetition(localStorage.getItem("bearer"));
    document.getElementById("submitConfirmText").textContent = operationMessage;
    if (operationMessage.includes("success")) {
        document.getElementById("uploadConfirmHeader").textContent = "Competition created!";
    } else {
        document.getElementById("uploadConfirmHeader").textContent = "Oh no! An error occured";
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
    toggleMultiplayerRestriction();
});

let multiplayerRestriction = "standard";

let restrictions = ["standard", "nmpz", "grayscale", "invert", "hue", "fade"];
let currentRestrictionIndex = 0;

function toggleMultiplayerRestriction() {
    if (toggleRestrictions.textContent == "Standard") {
        currentRestrictionIndex = 1; // start from the first restriction after standard
    } else {
        currentRestrictionIndex = (currentRestrictionIndex + 1) % restrictions.length;
    }
    multiplayerRestriction = restrictions[currentRestrictionIndex];

    // Update the button text
    switch (multiplayerRestriction) {
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

async function submitCompetition(token, name, author, authorId, restriction, duration, roundLength, description, rawLocations) {
    try {
        const requestBody = {
            name: name,
            author: author,
            authorId: authorId,
            restriction: restriction,
            duration: duration,
            roundLength: roundLength,
            description: description,
            rawLocations: rawLocations
        };

        const experienceEndpoint = competitionsEndpoint + "/create";
        // Make the PUT request using Fetch API
        const response = await fetch(experienceEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        // Check if the response is successful
        if (response.ok) {
            document.getElementById("uploadPopup").style.display = "none";
            competitionSubmittedSuccessfully = true;
            return "Map submitted successfully! Thank you so much for contributing.";
        } else {
            console.error('User update failed:', response.status);
        }
    } catch (error) {
        console.error('Error occurred during user update: ', error);
        displayError("Error occured during user update: " + error, errorSource);
    }
}
