// Global variables
let rewardClaimed = false;
var rewardedSlot;
var adLoadTimeout;

// Function to initialize the rewarded ad
export function initializeRewardAd(dismissFunction, rewardFunction) {
    // Set a timeout to handle the scenario where no ad is returned in 10 seconds
    adLoadTimeout = setTimeout(handleNoAdReturned, 10000);
    rewardClaimed = false;

    function handleNoAdReturned() {
        dismissFunction(true);
        try {
            googletag.destroySlots([rewardedSlot]);
        } catch (error) {
            console.error("Error destroying slot: " + error);
        }
    }

    // Function to safely initialize Google Tag
    function initializeGoogleTag() {
        if (typeof window.googletag !== "undefined" && googletag.cmd) {
            // Safe to proceed with initializing rewarded ad
            googletag.cmd.push(() => {
                rewardedSlot = googletag.defineOutOfPageSlot(
                    // Venatus will supply separate line below as this is a demo tag
                    // Actual tag: /21726375739,23114577746/ca-video-pub-5781531207509232-tag/openguessr.com_Rewarded_Video
                    // Test tag: /21726375739/ca-video-pub-5781531207509232-tag/Max_Rewarded_Video_Test'
                    '/21726375739,23114577746/ca-video-pub-5781531207509232-tag/openguessr.com_Rewarded_Video',
                    googletag.enums.OutOfPageFormat.REWARDED
                );

                if (rewardedSlot) {
                    rewardedSlot.addService(googletag.pubads());

                    googletag.pubads().addEventListener('rewardedSlotReady', function (event) {
                        clearTimeout(adLoadTimeout); // Clear the timeout when an ad is ready
                        event.makeRewardedVisible();
                    });

                    googletag.pubads().addEventListener('rewardedSlotClosed', () => {
                        setTimeout(() => {
                            dismissFunction(false, rewardClaimed);
                            try {
                                googletag.destroySlots([rewardedSlot]);
                            } catch (error) {
                                console.error("Error destroying slot: " + error);
                            }
                        }, 350);
                    });

                    googletag.pubads().addEventListener('rewardedSlotGranted', function (event) {
                        rewardClaimed = true;
                        rewardFunction();
                    });

                    googletag.enableServices();
                    googletag.display(rewardedSlot);
                }
            });
        } else {
            // Retry initialization after a short delay if googletag is not ready yet
            setTimeout(initializeGoogleTag, 300); // Increased delay to 300 milliseconds
        }
    }

    // Call the function to start the initialization process
    initializeGoogleTag();
}

// Trigger Google Tag initialization once everything is loaded
window.onload = () => {
    setTimeout(() => {
        try {
            window.googletag = window.googletag || { cmd: [] };
        } catch (error) {
            console.error("Google tag cannot be assigned: " + error);
        }
    }, 250);
};
