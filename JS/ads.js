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

function updateAds() {
    if (!admanager || !scope) return;

    // Remove all existing ads
    ['billboard', 'leaderboard', 'mobile_banner'].forEach(placementName => {
        try {
            const mainInstance = scope.Config.get(placementName, "main").instance();
            const resultInstance = scope.Config.get(placementName, "result").instance();
            if (mainInstance) admanager.removePlacement(mainInstance);
            if (resultInstance) admanager.removePlacement(resultInstance);
        } catch(error) {
            console.error("Error in custom ads.js while attempting to remove ad:", error);
        }
    });

    // In this scenario, no main-screen ads should be shown
    const isLandscapeSmall = window.matchMedia('(orientation: landscape) and (max-width: 700px)').matches;

    // Determines whether a desktop or mobile leaderboard ad should be used
    const usingFloatingResultAd = window.matchMedia('(max-width: 1900px)').matches;

    // Add new ads based on current screen
    if (currentScreen == "main" && !isLandscapeSmall) {
        scope.Config.buildPlacement((configBuilder) => {
            configBuilder.add('billboard');
            configBuilder.addDefaultOrUnique('leaderboard').setBreakPoint({ mediaQuery: 'max-width:1600px' });
            configBuilder.addDefaultOrUnique('mobile_banner').setBreakPoint({ mediaQuery: 'max-width: 1175px' });
        }, "main").display("bottomFooterAds");

    } else if (currentScreen == "result" && usingFloatingResultAd) {
        if (usingFloatingResultAd) {
            scope.Config.get("leaderboard", "result").display("floatingResultLeaderboardAd");
        } else {
            scope.Config.get("leaderboard", "result").display("mobileResultLeaderboardAd");
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