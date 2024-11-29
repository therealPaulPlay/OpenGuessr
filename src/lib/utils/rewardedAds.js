import { browser } from '$app/environment';

let isRewardVideoReady = false;
let firstLoad = true;
let playVideoTriggered = false;

let currentDismissFunction = null;
let currentRewardFunction = null;
let rewardClaimed = false;

// Initial setup (outside of any function, runs when the script is loaded)
try {
    // Don't load this on the Server (with SSR)
    if (browser) {
        self.__VM ??= [];
        self.__VM.push(function (admanager, scope) {
            scope.Config.get('gpt_reward').display({ body: true }).setKnown('gptReward');
            scope.Config.getKnown('gptReward').rewardedApi((api) => {
                // Dispatched when api is loading
                api.on('loading', (reward) => {
                    isRewardVideoReady = false;
                });

                // Dispatched if no available video
                api.on('empty', (reward) => {
                    isRewardVideoReady = false;
                    if (!firstLoad && playVideoTriggered) {
                        playVideoTriggered = false;
                        if (currentDismissFunction) currentDismissFunction(true, false);
                    } else {
                        firstLoad = false;
                    }
                });

                // Dispatched when api is ready, and okay to play
                api.on('ready', (reward) => {
                    isRewardVideoReady = true;
                    if (!firstLoad && playVideoTriggered) {
                        playVideoTriggered = false;
                        showVideo();
                    }
                });

                // Dispatched when the video is done playing
                api.on('rewarded', (reward) => {
                    isRewardVideoReady = false;
                    playVideoTriggered = false;
                    rewardClaimed = true;
                    if (currentRewardFunction) currentRewardFunction();
                    api.clear(); // Call to close the video player
                });

                // Dispatched when video is closed or skipped while playing
                api.on('closed', (reward) => {
                    isRewardVideoReady = false;
                    playVideoTriggered = false;
                    firstLoad = false;
                    if (currentDismissFunction) currentDismissFunction(false, rewardClaimed);
                    api.clear();
                    rewardClaimed = false; // Reset for next time
                });
            });
        });
    }
} catch (error) {
    console.error("Error occured during rewarded ad push:", error);
}


// This function is equivalent to playRewardVideo() in the documentation
export function initializeRewardedAd(dismissFunction, rewardFunction) {
    currentDismissFunction = dismissFunction;
    currentRewardFunction = rewardFunction;
    rewardClaimed = false;
    playVideoTriggered = true;

    if (isRewardVideoReady) {
        firstLoad = false;
        showVideo();
    } else {
        reloadReward();
    }
}

// Internal function to actually show the video
function showVideo() {
    self.__VM.push(function (admanager, scope) {
        scope.Config.getKnown('gptReward').rewardedApi((api) => {
            api.show();
        });
    });
}

// Internal function to reload the reward ad
function reloadReward() {
    self.__VM.push(function (admanager, scope) {
        scope.Config.getKnown('gptReward').reload();
    });
}