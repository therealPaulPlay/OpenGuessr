// Hard mode is a time limited mode accessed by the timer icon in the upper right hand corner of the screen.

import { checkGenerationTypeAndGenerate } from "./categoryMenu";
import { startTimer } from "./timer";
import { playSound } from "../src/lib/utils/soundManager";
import { openLocationOnMaps } from "./mainUI";
import { formatDistance } from "./main";

// Singleplayer Options UI ----------------------------------------------------------------------------------------

let isSingleplayerOpened = false;

document.getElementById("singleplayerOptionsClose").addEventListener("click", () => { playSound("basic_button"); toggleSingleplayerOptionsMenu(); });
document.getElementById("singleplayerOptionsButton").addEventListener("click", () => { playSound("basic_button"); toggleSingleplayerOptionsMenu(); });

let timerSlider = document.getElementById("timerSlider");

function toggleSingleplayerOptionsMenu() {
    isSingleplayerOpened = !isSingleplayerOpened;
    document.getElementById("blackBackground").style.visibility = isSingleplayerOpened ? "visible" : "hidden";
    document.getElementById("singleplayerOptionsWindow").style.display = isSingleplayerOpened ? "block" : "none";
    setTimerText();
    loadRoundLogItems();
    timerSlider.value = timeout;
}

// Timer Slider ---------------------------------------------------------------------------------------------------------------------------

timerSlider.addEventListener("input", setTimerText);
timerSlider.addEventListener("change", changeTimeout);

function setTimerText() {
    document.getElementById("timerSliderText").textContent = (timerSlider.value == 0 || !timerSlider.value) ? "No Timer" : timerSlider.value + " Seconds";
}

let hardModeFade = document.getElementById("hardModeFade");

function changeTimeout() {
    timeout = Number(timerSlider.value);
    localStorage.setItem("singleplayerTimer", timeout);

    hardModeFade.style.visibility = timeout ? "visible" : "hidden";

    checkGenerationTypeAndGenerate();
}

// Toggle Singleplayer Restrictions -----------------------------------------------------------------------------------

let isSingleplayerNMPZ = false;

isSingleplayerNMPZ = localStorage.getItem("singleplayerNMPZ") ? Boolean(localStorage.getItem("singleplayerNMPZ")) : false;
document.getElementById("setSingleplayerNMPZ").textContent = isSingleplayerNMPZ ? "Enabled" : "Disabled";

document.getElementById("setSingleplayerNMPZ").addEventListener("click", () => {
    isSingleplayerNMPZ = !isSingleplayerNMPZ;
    document.getElementById("setSingleplayerNMPZ").textContent = isSingleplayerNMPZ ? "Enabled" : "Disabled";
    localStorage.setItem("singleplayerNMPZ", isSingleplayerNMPZ ? "true" : "");
    checkGenerationTypeAndGenerate();

    playSound("basic_button");
});

// Apply singleplayer settings ----------------------------------------------------------------------------------
let timeout = localStorage.getItem("singleplayerTimer") != null ? Number(localStorage.getItem("singleplayerTimer")) : 0;

let timeoutVariable;
let startTimeoutVariable;
let intervalTimeoutVariable;

let timer;

let hardModeTitle = document.getElementById("hardModeTitle");
let hardModeSubtitle = document.getElementById("hardModeSubtitle");
let nmpzBackground = document.getElementById("nmpzSingleplayerBackground");

let startHardModePromise;

let playingSingleplayer = true;

export function setSingleplayer(enable) {
    playingSingleplayer = enable;
}

export function applySingleplayerSettings() {
    // Disable all here, then enable what should be enabled
    hardModeFade.style.opacity = "0";
    hardModeFade.style.pointerEvents = "none";
    nmpzBackground.style.pointerEvents = "none";
    try { timer.stopTimer(); } catch { }
    clearTimeout(timeoutVariable);
    clearTimeout(startTimeoutVariable);
    clearInterval(intervalTimeoutVariable);

    // Now, enable what's needed if in Singleplayer
    if (playingSingleplayer) {
        if (isSingleplayerNMPZ) {
            nmpzBackground.style.pointerEvents = "auto";
        }

        if (timeout) {
            // Show MapModeIndicator (Timer UI)
            document.getElementById("mapModeIndicator").style.display = "flex";
            document.getElementById("mapModeText").textContent = "Singleplayer";

            startHardModePromise = new Promise((resolve, reject) => {
                hardModeFade.style.opacity = "100%";
                hardModeFade.style.pointerEvents = "auto";
                hardModeSubtitle.innerText = "Get ready...";
                hardModeTitle.innerText = "Starting in 3";

                let loopIndex = 2;

                intervalTimeoutVariable = setInterval(() => {
                    hardModeTitle.innerText = "Starting in " + loopIndex;
                    loopIndex--;
                }, 700);

                startTimeoutVariable = setTimeout(() => {
                    resolve("start");
                    clearInterval(intervalTimeoutVariable);
                }, 2000);
            });

            startHardModePromise.then(function () {
                hardModeFade.style.opacity = "0";
                hardModeFade.style.pointerEvents = "none";

                timer = startTimer(timeout, () => {
                    hardModeFade.style.opacity = "100%";
                    hardModeTitle.innerText = "The time is up!";
                    hardModeFade.style.pointerEvents = "auto";
                    hardModeSubtitle.innerText = "Please take your guess.";
                });
            });
        } else {
            document.getElementById("mapModeIndicator").style.display = "none"; // Hide MapMpdeIndicator
        }
    }
}

// Round Log ---------------------------------------------------------------------------------------------------------------

let logBox = document.getElementById("roundLogBox");

let itemIndex = 0;

function addRoundLogItem(mode, distance, coordinates) {
    const item = document.createElement("div");
    item.classList.add("roundLogItem");
    itemIndex++;
    item.innerHTML = `
    <div>
        <p class="logItemMode">${mode}</p>
        <p>${formatDistance(distance)} away</p>
    </div>
    <button class="standardButton logItemButton" id="viewLogLocation${itemIndex}">View</button>
    `;

    logBox.appendChild(item);
    document.getElementById("viewLogLocation" + itemIndex).addEventListener("click", () => {
        playSound("basic_button");
        openLocationOnMaps(coordinates[0], coordinates[1]);
    });
}

let roundLog = [];

try {
    roundLog = JSON.parse(localStorage.getItem("roundLog")) || [];
} catch (error) { console.error("Error parsing roundLog JSON:", error)};

// Pass coordinates as array, [lat, long]
export function saveRoundToLog(mode, distance, coordinates) {
    roundLog.unshift([mode, distance, coordinates])
    if (roundLog.length > 10) roundLog.pop();

    localStorage.setItem("roundLog", JSON.stringify(roundLog));
}

function loadRoundLogItems() {
    logBox.innerHTML = ""; // Clear Box HTML

    if (roundLog.length > 0) {
        try {
            roundLog.forEach((element) => {
                addRoundLogItem(element[0], element[1], element[2]);
            });
        } catch (error) {
            console.error("Error loading round log:", error);
            console.error("The round log:", roundLog);
        }
    } else {
        logBox.innerHTML = `
        <p class="centerLogText">Play a few rounds to make them appear here.</p>
        `;
    }
}