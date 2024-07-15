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