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
    addCompetition(3, "Formerly cool Comp", "Paul", 55, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", true, false);
}

loadCompetitions();
