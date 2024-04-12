let hardMode = false;

let hardModeFade = document.getElementById("hardModeFade");

export function setHardMode(enabled) {
    hardMode = enabled;

    hardModeFade.style.visibility = hardMode ? "visible" : "hidden";
}

export function checkHardModeTimeout() {
    hardModeFade.style.opacity = "0";
    hardModeFade.style.pointerEvents = "none";
    
    if (hardMode) {
        setTimeout(() => {
            hardModeFade.style.opacity = "100%";
            hardModeFade.style.pointerEvents = "auto";
        }, 2000)
    }
}