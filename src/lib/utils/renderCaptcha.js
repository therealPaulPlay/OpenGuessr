export function renderCaptcha(elementId, callback) {
    try {
        turnstile.render(elementId, {
            sitekey: "0x4AAAAAAAi-FhzOg4nXIP3z",
            callback: callback, // Ensure this callback function is defined globally (window.functionName)
        });
    } catch (error) {
        console.error("Error occured trying to render captcha with Turnstile:", error);
    }
}