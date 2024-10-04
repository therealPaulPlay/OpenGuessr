// Initialize Venatus
self.__VM = self.__VM || [];
self.__VM.push(handleAdManagerPush);

console.log("Ads.js loaded.");

let currentScreen = 'main';

// Global vars for admanager and scope to use them in this code independently
let admanager, scope;

export function switchAdsToResultScreen() {
    if (currentScreen == "result") return;
    currentScreen = "result";
    updateAds();
}

export function switchAdsToMainScreen() {
    if (currentScreen == "main") return;
    currentScreen = "main";
    updateAds();
}

let mainInstance;
let resultInstance;

function updateAds() {
    if (!admanager || !scope) return;

    // Remove existing ads
    try {
        if (mainInstance) admanager.removePlacement(mainInstance.instance());
        if (resultInstance) admanager.removePlacement(resultInstance.instance());

    } catch (error) {
        console.error("Error in custom ads.js while attempting to remove ad configurations:", error);
    }

    // In this scenario, no main-screen ads should be shown
    const isLandscapeSmall = window.matchMedia('(orientation: landscape) and (max-width: 700px)').matches;

    // Add new ads based on current screen
    if (currentScreen == "main" && !isLandscapeSmall) {

        // Config for the main bottom footer ad
        try {
            mainInstance = scope.Config.buildPlacement((configBuilder) => {
                scope.Config.setBreakPoint("desktop", "(min-width:1375px)");

                configBuilder.add("leaderboard");

                configBuilder.addDefaultOrUnique("mobile_banner").setBreakPoint({
                    mediaQuery: "max-width: 1375px"
                });

            }, "main").display("bottomFooterAds");

        } catch (error) {
            console.error("Error setting ad configs for main screen:", error);
        }

    } else if (currentScreen == "result") {

        // Config for the result screen
        try {
            if (window.matchMedia('(min-width: 1900px)').matches) {
                // Leaderboard ad slot for large desktop screens
                resultInstance = scope.Config.get("leaderboard", "result").display("floatingResultLeaderboardAd");

            } else {
                resultInstance = scope.Config.buildPlacement((configBuilder) => {
                    // (Different) Mobile banner ad slot for smaller screens
                    scope.Config.setBreakPoint("desktop", "(min-width:1900px)");

                    configBuilder.add("mobile_banner");

                    // Default option not necessary here, as this slot is mobile only
                    // It seems like the config won't work without a default option however, which is why it is there but redundant
                    configBuilder.addDefaultOrUnique("mobile_banner").setBreakPoint({
                        mediaQuery: "max-width: 1900px"
                    });

                }, "result").display("mobileResultLeaderboardAd");
            }
        } catch (error) {
            console.error("Error setting ad configs for result screen:", error);
        }
    }

    console.log("Ads updated.");
}

function handleAdManagerPush(_admanager, _scope) {
    admanager = _admanager;
    scope = _scope;

    // Initial ad setup
    updateAds();
}