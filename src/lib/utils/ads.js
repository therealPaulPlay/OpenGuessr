
// Initialize Venatus
export function initializeAds() {
    self.__VM = self.__VM || [];

    self.__VM.push((admanager, scope) => {
        try {
            if (!admanager || !scope) return;

            // Main bottom bar ad
            scope.Config.buildPlacement((configBuilder) => {
                scope.Config.setBreakPoint("desktop", "(min-width:1500px)");

                configBuilder.add("leaderboard");

                configBuilder
                    .addDefaultOrUnique("mobile_banner")
                    .setBreakPoint({
                        mediaQuery: "max-width: 1500px",
                    });
            }, "main").display("gameplayAd");

            // Floating banner for bigger screens
            scope.Config.get("leaderboard", "result").display(
                "resultAd",
            );

            // Mobile result banner for smaller screens
            scope.Config.buildPlacement((configBuilder) => {
                configBuilder.add("mobile_banner");

                configBuilder
                    .addDefaultOrUnique("mobile_banner")
                    .setBreakPoint({
                        mediaQuery: "max-width: 1900px",
                    });
            }, "result").display("mobileResultAd");
        } catch (error) {
            console.error("Error creating placements:", error);
        }
    });
}

export function refreshPlacements() {
    self.__VM = self.__VM || [];

    self.__VM.push(function (admanager, scope) {
        admanager.reload(
            admanager.placements.filter((p) => p.anyName !== "gpt_reward"),
        );
    });
}
