// Hard mode is a time limited mode accessed by the timer icon in the upper right hand corner of the screen.

import { checkGenerationTypeAndGenerate } from "./categoryMenu";
import { startTimer } from "./timer";
import { playSound } from "./soundManager";

// Singleplayer Options UI ----------------------------------------------------------------------------------------

let isSingleplayerOpened = false;

document.getElementById("singleplayerOptionsClose").addEventListener("click", toggleSingleplayerOptionsMenu);
document.getElementById("singleplayerOptionsButton").addEventListener("click", toggleSingleplayerOptionsMenu);

let timerSlider = document.getElementById("timerSlider");

function toggleSingleplayerOptionsMenu() {
    isSingleplayerOpened = !isSingleplayerOpened;
    document.getElementById("blackBackground").style.visibility = isSingleplayerOpened ? "visible" : "hidden";
    document.getElementById("singleplayerOptionsWindow").style.display = isSingleplayerOpened ? "block" : "none";
    setTimerText();
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

let isSingleplayer = true;

export function setSingleplayer(enable) {
    isSingleplayer = enable;
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
    if (isSingleplayer) {
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