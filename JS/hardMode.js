// Hard mode is a time limited mode accessed by the timer icon in the upper right hand corner of the screen.

import { checkGenerationTypeAndGenerate } from "./categoryMenu";
import { playSound } from "./soundManager";

let hardMode = false;
let hardmodeState = 0;
let timeout = 2500;

let hardModeFade = document.getElementById("hardModeFade");

let toggleTimoutButton = document.getElementById("timerButton");

let timerIcon = document.getElementById("timerIcon");

let timeoutVariable;
let startTimeoutVariable;
let intervalTimeoutVariable;

hardmodeState = localStorage.getItem("hardmodeTimeout") != null ? hardmodeState = Number(localStorage.getItem("hardmodeTimeout")) : 0;
setHardmodeTimeout();

toggleTimoutButton.addEventListener("click", () => {
    playSound("basic_button");
    hardmodeState++;
    if (hardmodeState > 2) {
        hardmodeState = 0;
    }
    setHardmodeTimeout();
    checkGenerationTypeAndGenerate();
});

function setHardmodeTimeout() {
    switch (hardmodeState) {
        case 0:
            setHardMode(false);
            timerIcon.src = "/IMG/timer_icon.png";
            break;
        case 1:
            setHardMode(true);
            timeout = 2500;
            timerIcon.src = "/IMG/timer_icon_1s.png";
            break;
        case 2:
            setHardMode(true);
            timeout = 5500;
            timerIcon.src = "/IMG/timer_icon_5s.png";
            break;
        default:
            setHardMode(false);
            timerIcon.src = "/IMG/timer_icon.png";
            break;
    }
    localStorage.setItem("hardmodeTimeout", hardmodeState);
}

export function setHardMode(enabled) {
    hardMode = enabled;
    hardModeFade.style.visibility = hardMode ? "visible" : "hidden";
    if (!enabled) {
        timerIcon.src = "/IMG/timer_icon.png";
        hardmodeState = 0;
        localStorage.setItem("hardmodeTimeout", hardmodeState);
    }
}

let hardModeTitle = document.getElementById("hardModeTitle");
let hardModeSubtitle = document.getElementById("hardModeSubtitle");
let resetButton = document.getElementById("resetButtonSVG");
let startHardModePromise;

export function checkHardModeTimeout() {
    hardModeFade.style.opacity = "0";
    hardModeFade.style.pointerEvents = "none";

    if (hardMode) {
        clearTimeout(timeoutVariable);
        clearTimeout(startTimeoutVariable);
        clearInterval(intervalTimeoutVariable);

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

            timeoutVariable = setTimeout(() => {
                hardModeFade.style.opacity = "100%";
                hardModeTitle.innerText = "The time is up!";
                hardModeFade.style.pointerEvents = "auto";
                hardModeSubtitle.innerText = "Please take your guess.";
            }, timeout)
        });
    }
}