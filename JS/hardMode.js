let hardMode = false;

let hardModeFade = document.getElementById("hardModeFade");

export function setHardMode(enabled) {
    hardMode = enabled;

    hardModeFade.style.visibility = hardMode ? "visible" : "hidden";
}

let hardModeTitle = document.getElementById("hardModeTitle");
let hardModeSubtitle = document.getElementById("hardModeSubtitle");
let startHardModePromise;

export function checkHardModeTimeout() {
    hardModeFade.style.opacity = "0";
    hardModeFade.style.pointerEvents = "none";
    
    if (hardMode) {
        startHardModePromise = new Promise((resolve, reject) => {
            hardModeFade.style.opacity = "100%";
            hardModeFade.style.pointerEvents = "auto";

            hardModeSubtitle.innerText = "Get ready...";
            hardModeTitle.innerText = "Starting...";

            let loopIndex = 0;

            for (let i = 3; i > 0; i--) {
                setTimeout(function() {
                    hardModeTitle.innerText = "Starting in " + i;
                }, 1000 * loopIndex);

                loopIndex++;
            }

            setTimeout(() => {
              resolve("start");
            }, 3000);
          });

          startHardModePromise.then(function() {
            hardModeFade.style.opacity = "0";
            hardModeFade.style.pointerEvents = "none";
    
            setTimeout(() => {
                hardModeFade.style.opacity = "100%";
                hardModeTitle.innerText = "The time is up!";
                hardModeFade.style.pointerEvents = "auto";
                hardModeSubtitle.innerText = "Please take your guess.";
            }, 2500)
        });
    }
}