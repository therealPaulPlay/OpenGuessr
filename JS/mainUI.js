import { closePopup } from "./errorHandling.js";
import { reloadIframe } from "./main.js";
import { setUserXP, uiSetUserXP, isAuthenticated } from "./accountLogic.js";
import { toggleMultiplayerSelector } from "./multiplayer.js";

//How to play - Window ---------------------------------------------------------------------------------------
let helpButton = document.getElementById("helpButton");
helpButton.addEventListener("click", toggleHelpWindow)

let helpWindow = document.getElementById("helpWindow");

let helpClose = document.getElementById("helpClose");
helpClose.addEventListener("click", toggleHelpWindow);

function toggleHelpWindow() {
    if (helpWindow.style.display == "block") {
        helpWindow.style.display = "none";
        document.getElementById("blackBackground").style.visibility = "hidden";
    } else {
        helpWindow.style.display = "block";
        document.getElementById("blackBackground").style.visibility = "visible";
    }
}

//Social Menu and Leaderboard link --------------------------------------------------------------------------
export let socialBarExpanded = false;

document.getElementById("floatingSocialButton").addEventListener("click", toggleSocialbar);

export function toggleSocialbar() {
    try {
        if (!socialBarExpanded) {
            document.getElementById("socialBar").style.maxHeight = "1000px";
            socialBarExpanded = true;
            document.getElementById("floatingSocialButton").innerHTML = "Social Menu ▲";
        } else {
            document.getElementById("socialBar").style.maxHeight = "0";
            socialBarExpanded = false;
            document.getElementById("floatingSocialButton").innerHTML = "Social Menu ▼";
        }
    } catch (error) {
        console.warn("Socialbar couldn't be closed: ", error);
    }
}

document.getElementById("leaderboardButton").addEventListener("click", goToLeaderboard);
document.getElementById("dailyLeaderboardButton").addEventListener("click", goToDailyLeaderboard);

function goToLeaderboard() {
    window.location.href = "/leaderboard.html";
}

function goToDailyLeaderboard() {
    window.location.href = "/dailyLeaderboard.html";
}

//Toggle Map on mobile devices ---------------------------------------------------------------------------------------
let toggleMapButton = document.getElementById("floatingMapButton");

let mapExpanded = true;

toggleMapButton.addEventListener("click", toggleMap);

function toggleMap() {
    if (!mapExpanded) {
        document.getElementById("map").style.maxHeight = "100%";
        mapExpanded = true;
    } else {
        document.getElementById("map").style.maxHeight = "0%";
        mapExpanded = false;
    }
}

export function shrinkMapIfMobile() {
    if (window.innerHeight > window.innerWidth && mapExpanded) {
        toggleMap();
    }
}

export function hideToggleMapButtonIfMobile(hide) {
    if (window.innerHeight > window.innerWidth) {
        if (hide) {
            toggleMapButton.style.visibility = "hidden";
        } else {
            toggleMapButton.style.visibility = "visible";
        }
    }
}

//Universal Popup Window (Account info and How to play window) ------------------------------------------------------------
let closeButton = document.getElementById("popupClose");
closeButton.addEventListener("click", closePopup);

//Various buttons and links ------------------------------------------------------------------------------------------------
let resetBTN = document.getElementById("resetButtonSVG");
resetBTN.addEventListener("click", function () { reloadIframe() });

let socialRedditButton = document.getElementById("redditButton");
socialRedditButton.addEventListener("click", function () { window.open("https://www.reddit.com/r/OpenGuessr/", '_blank').focus() });

let socialDiscordButton = document.getElementById("discordButton");
socialDiscordButton.addEventListener("click", function () { window.open("https://discord.gg/CSc3MbDrZ8", '_blank').focus() });

document.getElementById("categoryNew").addEventListener("click", function () { window.open("https://discord.gg/CSc3MbDrZ8", '_blank').focus() });

let privacyButton = document.getElementById("privacyButton");
privacyButton.addEventListener("click", function () { window.location.href = "/legal.html" });

//Result screen animations ---------------------------------------------------------------------------------------------------------
export let resultScreenEnabled = false;

export function enableResultScreen(resultString, extraMessage) {
    document.getElementById("EndOverlay").style.opacity = "100%";
    document.getElementById("EndOverlay").style.visibility = "visible";

    document.getElementById("distanceText").innerText = "Your guess was " + resultString + " away from the target.";
    document.getElementById("motivationText").innerText = extraMessage;

    resultScreenEnabled = true;
}

export function disableResultScreen() {
    document.getElementById("EndOverlay").style.opacity = "0%";
    setTimeout(function () { document.getElementById("EndOverlay").style.visibility = "hidden" }, 200)

    resultScreenEnabled = false;
}

//Extended Navbar dropdown (Category Selection Area) ------------------------------------------------------------------------------
let extendedNavbar = document.getElementById("extendedNavbar");
let categoryMenuButton = document.getElementById("categoryMenuButton");
let floatingCategoryArea = document.getElementById("floatingCategoryArea");

let categoriesExpanded = false;

categoryMenuButton.addEventListener("click", function () {
    toggleCategoryMenu(false)
});

export function toggleCategoryMenu(alwaysClose) {
    try {
        if (alwaysClose) {
            categoriesExpanded = true;
        }

        if (!categoriesExpanded) {
            floatingCategoryArea.style.top = "360px";
            document.getElementById("extendedNavbarContent").scrollTop = "0";
            document.getElementById("extendedNavbarGradient").style.display = "block";
            extendedNavbar.classList.add("expanded");
            categoryMenuButton.innerText = "Map Categories ▲";
            categoriesExpanded = true;
        } else {
            setTimeout(function () {
                floatingCategoryArea.style.top = "85px";
                document.getElementById("extendedNavbarGradient").style.display = "none";
            }, 75);
            extendedNavbar.classList.remove("expanded");
            categoryMenuButton.innerText = "Map Categories ▼";
            categoriesExpanded = false;
        }
    } catch {
        console.warn("Couldn't toggle category menu");
    }

}

//Social / Discord Join Popup -----------------------------------------------------------------------------------------------------

let socialWindow = document.getElementById("socialWindow");

function showSocialPopup() {
    document.getElementById("discordWidget").setAttribute("src", "https://discord.com/widget?id=1221841177863651499&theme=dark");
    socialWindow.style.display = "block";
    document.getElementById("blackBackground").style.visibility = "visible";
}

function closeSocialPopup() {
    socialWindow.style.display = "none";
    document.getElementById("blackBackground").style.visibility = "hidden";
    localStorage.setItem("discordPopup", "true");
}

export function socialPopupProbability() {
    if (isAuthenticated && localStorage.getItem("discordPopup") == null) {
        const randomNumber = Math.floor(Math.random() * 3);

        if (randomNumber === 0) {
            showSocialPopup();
        }
    }
}

document.getElementById("socialPopupClose").addEventListener("click", closeSocialPopup);

document.getElementById("socialPopupJoin").addEventListener("click", function () {
    window.open("https://discord.gg/CSc3MbDrZ8", '_blank').focus();
    setTimeout(async function () {
        closeSocialPopup();
        await setUserXP(Number(localStorage.getItem("experience")) + 7500);
        uiSetUserXP(localStorage.getItem("experience"));
    }, 200)
});

//reveal compass -------------------------------------------------------------------------------------
let revealCompass = document.getElementById("revealCompass");
revealCompass.addEventListener("click", toggleMapOffset);

let mapOffset = false;

function toggleMapOffset() {
    if (mapOffset) {
        document.getElementById("map").style.marginRight = "0.75%";
        document.getElementById("mapModeIndicator").style.marginRight = "0.75%";
        revealCompass.style.marginRight = "0.75%";
        revealCompass.innerHTML = "reveal compass";
        mapOffset = false;
    } else {
        document.getElementById("map").style.marginRight = "65px";
        document.getElementById("mapModeIndicator").style.marginRight = "65px";
        revealCompass.style.marginRight = "65px";
        revealCompass.innerHTML = "hide compass";
        mapOffset = true;
    }
}

//switch UI toggles back to standard on window resize ----------------------------------------------

window.addEventListener("resize", (event) => {
    mapOffset = true;
    toggleMapOffset();
    mapExpanded = false;
    toggleMap();
});

//Username UI endless scroll --------------------------------------------------------------------------------------------------
// Get the elements
const accountName = document.getElementById('accountName');

// Check if the text length exceeds the threshold
export function checkTextLength() {
    const textLength = accountName.textContent.length;

    if (textLength > 20) {
        accountName.classList.add('scroll');
    } else {
        accountName.classList.remove('scroll');
    }
}

// Check for text length initially and when the text changes
window.addEventListener('DOMContentLoaded', checkTextLength); // Check on page load
window.addEventListener('input', checkTextLength); // Check when text changes


//Mobile UI Menu -----------------------------------------------------------------------------------------
let mobileWindow = document.getElementById("mobileWindow");
let mobileMenuButton = document.getElementById("mobileMenu");

mobileMenuButton.addEventListener("click", toggleMobileMenu);

let mobileWindowOpen = false;

export function toggleMobileMenu() {
    mobileWindowOpen = !mobileWindowOpen;

    if (mobileWindowOpen) {
        mobileWindow.style.display = "block";

        setTimeout(() => {
            mobileWindow.style.opacity = "1";
            mobileWindow.style.scale = "1";
        }, 50);

        document.getElementById("blackBackground").style.visibility = "visible";
    } else {
        mobileWindow.style.opacity = "0";
        mobileWindow.style.scale = "0.95";
        mobileWindow.style.display = "none";
        document.getElementById("blackBackground").style.visibility = "hidden";
    }
}

document.getElementById("mobilePopupClose").addEventListener("click", toggleMobileMenu);

document.getElementById("mobileLeaderboardButton").addEventListener("click", goToLeaderboard);
document.getElementById("mobileDailyLeaderboardButton").addEventListener("click", goToDailyLeaderboard);
document.getElementById("mobileMultiplayerButton").addEventListener("click", function () {
    toggleMobileMenu();
    toggleMultiplayerSelector();
});

document.getElementById("mobileCategoryButton").addEventListener("click", function () {
    toggleMobileMenu();
    toggleCategoryMenu();
    shrinkMapIfMobile();
});

//Community Category Credits UI ----------------------------------------------------------------------------
function addCommunityCreditTag() {
    let communityCategories = document.getElementsByClassName("communityMap");
    let communityCategoriesArray = Array.from(communityCategories); // Convert to array
    for (let i = 0; i < communityCategoriesArray.length; i++) {
        let infoButtonId = communityCategoriesArray[i].id + "Info";
        communityCategoriesArray[i].innerHTML += `<img class="specialCategoryInfo" id="${infoButtonId}" alt="community category info" src="/IMG/info_icon.png">`;
    }

    //Event Listeners and text for credit popups for community maps
    document.getElementById("mountainCategoryInfo").addEventListener("click", (event) => {
        event.stopPropagation();
        openCreditWindow("Mountains by Blockween", "Whether you like big and spiky or small and smooth mountains, Blockween's map satisfys the needs of even the most fanatic mountain enthusiasts.<br><br>This map is not only suitable for those who crave the thrill of reaching new heights in real life, but also gamers who want to impress their relatives with a half-true story about their amazing hiking trip. Either way, get your hiking boots ready!");
    });

    document.getElementById("indoorCategoryInfo").addEventListener("click", (event) => {
        event.stopPropagation();
        openCreditWindow("Indoor by Zander", "Rather than getting caught himself, our favourite fish definitely caught my eye with this amazing map. Most of our community prefers the inside world in real life, so why not create a map that perfectly suits the needs of these gamers?<br><br> Usually, people who participate in outdoor activities were able to use some of their knowledge for playing OpenGuessr, but this new map turns the tables.");
    });

    document.getElementById("stadiumCategoryInfo").addEventListener("click", (event) => {
        event.stopPropagation();
        openCreditWindow("Stadiums by Falip", "Falip introduced himself to the discord server with this amazing  stadium map. It includes a huge variety of stadium locations, satisfying even the most diehard sports fans. Can you name them all?");
    });

    document.getElementById("whetherspoonCategoryInfo").addEventListener("click", (event) => {
        event.stopPropagation();
        openCreditWindow("Whetherspoons by Jdawg", "It doesn't matter whether it's a Whetherspoon located in the center of London or at the edge of Norwhich, chances are, Jdawg has seen it - at least digitally. It's still unknown where his affinity for british pubs is coming from, but I for sure hope it isn't a sign of an alcohol addiction.");
    });

    document.getElementById("skyscraperCategoryInfo").addEventListener("click", (event) => {
        event.stopPropagation();
        openCreditWindow("Skyscrapers by QwidziT", "Do you remember how obsessed you were with mega structures when you were a kid? No matter the age, everybody loves tall shiny buildings – skyscrapers – and this map is full of these magnificent beauties. Furthermore, this map is perfectly suited towards beginners, as you'll always have a tall navigational aid. ");
    });
}

window.addEventListener('DOMContentLoaded', addCommunityCreditTag);

let creditWindow = document.getElementById("creditWindow");

function openCreditWindow(title, description) {
    if (title != undefined) {
        document.getElementById("creditPopupTitle").innerHTML = title;
        document.getElementById("creditPopupText").innerHTML = description;
    }

    creditWindow.style.display = "block";
    document.getElementById("blackBackground").style.visibility = "visible";
}

document.getElementById("creditWindowClose").addEventListener("click", () => {
    creditWindow.style.display = "none";
    document.getElementById("blackBackground").style.visibility = "hidden";
})

//Prevent automatic "last button press" with space bar or enter key ------------------------------------------------------------------
document.addEventListener('keydown', function(event) {
    var tag = event.target.tagName.toLowerCase();
    if (event.key === 'Enter' || event.key === ' ') {
      if (tag === 'button') {
        event.preventDefault();
      }
    }
  });