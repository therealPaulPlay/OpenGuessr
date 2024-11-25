import { playSound } from "../src/lib/utils/soundManager.js";

// Various buttons and links -----------------------------------------------------------------------------------------------------------------
document.getElementById("discoverMaps").addEventListener("click", () => { playSound("basic_button"); showPageBrowser("/maps.html"); });
document.getElementById("discoverEducation").addEventListener("click", function () { playSound("basic_button"); window.open("https://education.openguessr.com", '_blank').focus() });

// Map Category menu (extended navbar) -------------------------------------------------------------------------------------------------
let extendedNavbar = document.getElementById("extendedNavbar");
let categoryMenuButton = document.getElementById("categoryMenuButton");
let topButtonArea = document.getElementById("topButtonArea");
let mobileButtonArea = document.getElementById("mobileButtonArea");

let categoriesExpanded = false;

categoryMenuButton.addEventListener("click", function () {
    toggleCategoryMenu(false);
    playSound("floating_button");
});

document.getElementById("mobileCategoriesClose").addEventListener("click", () => {
    toggleCategoryMenu(true);
    playSound("basic_button");
});

export function toggleCategoryMenu(alwaysClose) {
    try {
        if (alwaysClose) {
            categoriesExpanded = true;
        }

        let moveTimeouts;
        let mobileControlsTimeout;

        if (!categoriesExpanded) {
            clearTimeout(moveTimeouts);
            clearTimeout(mobileControlsTimeout);
            document.getElementById("extendedNavbarContent").scrollTop = "0";

            if (window.matchMedia("(max-width: 600px)").matches) {
                extendedNavbar.classList.add("expandedMobile");
                document.getElementById("extendedNavbarGradient").style.display = "block";
                document.getElementById("extendedNavbarGradient").style.borderRadius = "0";

                mobileControlsTimeout = setTimeout(() => {
                    document.getElementById("mobileExtendedNavbarControls").style.display = "flex";
                    document.getElementById("mobileExtendedNavbarControls").style.opacity = "1";
                }, 150);
            } else {
                document.getElementById("extendedNavbarGradient").style.borderRadius = "0 0 10px 10px";
                mobileButtonArea.style.top = "465px";
            }

            moveTimeouts = setTimeout(() => {
                topButtonArea.style.top = "465px";
                document.getElementById("extendedNavbarGradient").style.display = "block";
                extendedNavbar.classList.add("expanded");
                document.getElementById("mapsArrow").classList.add("arrowIconRotated");
                categoriesExpanded = true;
            }, 100);

        } else {
            clearTimeout(moveTimeouts);
            clearTimeout(mobileControlsTimeout);
            setTimeout(function () {
                topButtonArea.style.top = "15px";
                mobileButtonArea.style.top = "15px";
                document.getElementById("extendedNavbarGradient").style.display = "none";
                document.getElementById("mobileExtendedNavbarControls").style.display = "none";
            }, 75);
            document.getElementById("mobileExtendedNavbarControls").style.opacity = "0";
            extendedNavbar.classList.remove("expanded");
            extendedNavbar.classList.remove("expandedMobile");
            document.getElementById("mapsArrow").classList.remove("arrowIconRotated");
            categoriesExpanded = false;
        }
    } catch (error) {
        console.warn("Couldn't toggle category menu: " + error);
    }

}

// Expand Countries Category section in map menu -----------------------------------------------------------------------------------

let countryCategoriesExpand = document.getElementById("countryCategoriesExpand");
let countryCategoryArea = document.getElementById("expandableCountryArea");

let countryCategoriesExpanded = false;

countryCategoriesExpand.addEventListener("click", () => {

    if (countryCategoriesExpanded) {
        countryCategoryArea.style.maxHeight = "185px";
        document.getElementById("arrowIconCountries").style.rotate = "0deg";
        document.getElementById("countryCategoriesFade").style.opacity = "1";
        document.getElementById("countriesMoreText").style.width = "fit-content"
        document.getElementById("countriesMoreText").style.marginRight = "5px";
    } else {
        countryCategoryArea.style.maxHeight = "2000px";
        document.getElementById("arrowIconCountries").style.rotate = "180deg";
        document.getElementById("countryCategoriesFade").style.opacity = "0";
        document.getElementById("countriesMoreText").style.width = "0"
        document.getElementById("countriesMoreText").style.marginRight = "0";
    }

    countryCategoriesExpanded = !countryCategoriesExpanded;
});

// Supporter Boost effect -------------------------------------------------------------------------------

let supporterBoost = document.getElementById("supporterBoost");
let supporterBoostText = document.getElementById("supporterBoostText");
let supporterBoostTimeout;

export async function supporterXpBoostAnimation(factor) {
    supporterBoost.style.opacity = "0";
    supporterBoostText.classList.remove("supporterBoostTextMove");
    clearTimeout(supporterBoostTimeout);

    await new Promise(resolve => {
        supporterBoostTimeout = setTimeout(resolve, 1500);
    });

    factor -= 1;
    factor = Math.round(factor * 100);
    factor += "%";

    supporterBoostText.textContent = factor + " Experience Boost";

    supporterBoost.style.opacity = "1";
    supporterBoostText.classList.add("supporterBoostTextMove");

    supporterBoostTimeout = setTimeout(() => {
        supporterBoost.style.opacity = "0";
        supporterBoostText.classList.remove("supporterBoostTextMove");
    }, 2000);
}

// In-App page browser -------------------------------------------------------------------------------------------------------

/*
KEPT AROUND FOR FUTURE INSPECTION

window.onmessage = function (e) {
    try {
        const data = String(e.data); // Ensure data is a string

        const profileMatch = data.match(/^profile(\d+)$/); // extract profile id if text includes profile

        switch (true) {
            case data === "reloadCommunityMaps":
                loadCommunityCategories();
                attachCategoryEventListeners();
                break;
            case data === "loadCategory":
                loadMapCategory();
                changeCategory(mapCategory, false);
                break;
            case data === "reloadCategory":
                loadMapCategory();
                changeCategory(mapCategory, true);
                break;
            case data === "loadCompetition":
                loadCompetition(true);
                break;
        }
    } catch (error) {
        console.error("Error processing window message: " + error);
    }
};
*/
