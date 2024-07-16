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

// add competitions programmatically ---------------------------------------------------------------

let normalAddSuccessful = false;
let expiredAddSuccessful = false;

function addCompetition(id, name, author, playercount, restriction, duration, remainingDuration, locationAmount, roundLength, description, expired) {
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

    container.innerHTML += `
    <div class="competitionItem${expiredItem}">
                        <h2 class="competitonItemHeader">${name}</h2>
                        <p class="competitionAuthor">hosted by ${author}</p>
                        <div class="competitionPropertiesBox">
                            <div class="propertyItem${expiredItem}">
                                <div class="label${expiredItem}">
                                    <p>Players</p>
                                </div>
                                <p class="itemText">${playercount} Joined</p>
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
                                <p class="itemText">${duration} (${remainingDuration} remaining)</p>
                            </div>
                            <div class="propertyItem${expiredItem}">
                                <div class="label${expiredItem}">
                                    <p>Locations</p>
                                </div>
                                <p class="itemText">${locationAmount} Locations</p>
                            </div>
                            <div class="propertyItem${expiredItem}">
                                <div class="label${expiredItem}">
                                    <p>Round length</p>
                                </div>
                                <p class="itemText">${roundLength} seconds</p>
                            </div>
                        </div>
                        <div class="competitionDesc${expiredItem}">
                            <div class="label${expiredItem}">
                                <p>About</p>
                            </div>
                            <p class="itemText">${description}</p>
                        </div>
                        <div class="buttonBox competitionButtonBox">
                            <button id="leaderboardButton${id}" class="standardButton competitionButton leftButton">Leaderboard
                                <img class="textIcon invert" src="/IMG/leaderboards_icon.png"
                                    alt="Leaderboards for OpenGuessr">
                            </button>
                            <button id="enterButton${id}" style="${displayEnterButton}"class="standardButton competitionButton primaryButton">Enter</button>
                        </div>
                    </div>
    `;

    const leaderboardButton = document.getElementById("leaderboardButton" + id);
    const enterButton = document.getElementById("enterButton" + id);

    leaderboardButton.addEventListener("click", () => {
        openLeaderboard(id, name);
    });

    enterButton.addEventListener("click", () => {
        enterCompetitionPopup(id, name);
    });

}


// Open leaderboard and enter competition ------------------------------------------------------------------------------------------------------

function openLeaderboard(id, name) {


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

// load competitions --------------------------------------------------------------------------------------

function loadCompetitions() {
    // load from server, id has to be unique

    addCompetition(0, "Cool Comp", "Paul", 17, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", false);
    addCompetition(1, "Formerly cool Comp", "Paul", 55, "none", "5d", "2d", "5", "30", "This is a test map that is very insane.", true);
}

loadCompetitions();