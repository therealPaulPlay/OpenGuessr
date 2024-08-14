//once everything is loaded, load the google tag
window.onload = () => {
    setTimeout(() => {
        try {
            googletag = window.googletag || { cmd: [] };
        } catch (error) {
            console.error("Google tag cannot be assigned: " + error);
        }
    }, 250);
  };

let rewardClaimed = false;
var rewardedSlot;
var adLoadTimeout;

export function initializeRewardAd(dismissFunction, rewardFunction) {
    // Set a timeout to handle the scenario where no ad is returned in 10 seconds.
    adLoadTimeout = setTimeout(handleNoAdReturned, 10000);
    rewardClaimed = false;

    function handleNoAdReturned() {
        dismissFunction(true);
        try { googletag.destroySlots([rewardedSlot]); } catch (error) { console.error("Error destroying: " + error); }
    }

    try {
        googletag.cmd.push(function () {
            rewardedSlot = googletag.defineOutOfPageSlot(
                // Venatus will supply separate line below as this is a demo tag
                // actual tag: /21726375739,23114577746/ca-video-pub-5781531207509232-tag/openguessr.com_Rewarded_Video
                // Test tag: /21726375739/ca-video-pub-5781531207509232-tag/Max_Rewarded_Video_Test'
                '/21726375739,23114577746/ca-video-pub-5781531207509232-tag/openguessr.com_Rewarded_Video',
                googletag.enums.OutOfPageFormat.REWARDED);

            if (rewardedSlot) {
                rewardedSlot.addService(googletag.pubads());

                googletag.pubads().addEventListener('rewardedSlotReady', function (event) {
                    clearTimeout(adLoadTimeout);  // Clear the timeout when an ad is ready
                    event.makeRewardedVisible();
                });

                googletag.pubads().addEventListener('rewardedSlotClosed', () => {
                    setTimeout(() => {
                        dismissFunction(false, rewardClaimed);
                        try { googletag.destroySlots([rewardedSlot]); } catch (error) { console.error("Error destroying: " + error); }
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
    } catch (error) {
        console.error("Error loading the rewarded ad: " + error);
    }
}