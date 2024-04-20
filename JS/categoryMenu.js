import { loadLocationJSON } from "./locationGeneration.js";
import { resMap, generateNewLocation } from "./main.js";
import { disableResultScreen, socialPopupProbability } from "./mainUI.js";
import { setDailyChallengeUI, dailyChallengeUIEnabled, dailyChallengeEnd, checkDailyChallengeCompletion, globalTimer } from "./dailyChallenge.js";
import { setHardMode } from "./hardMode.js";
import { multiplayer, showMultiplayerOverlay } from "./multiplayer.js";

//Defined Categories ------------------------------------------------------------------------
const Category = {
    STANDARD: "standard",
    CAPITAL: "capital",
    FAMOUS: "famous",
    USA: "usa",
    GERMANY: "germany",
    UK: "uk",
    FRANCE: "france",
    SPAIN: "spain",
    POLAND: "poland",
    CANADA: "canada",
    SWEDEN: "sweden",
    INDIA: "india",
    MEXICO: "mexico",
    ITALY: "italy",
    UKRAINE: "ukraine",
    DAILY: "daily",
    HARD: "hard"
}

export let mapCategory = Category.STANDARD; //default category

//Category Button click listeners -------------------------------------------------------------
const standardCategoryButton = document.getElementById("standardCategory");
const capitalCategoryButton = document.getElementById("capitalCategory");
const famousCategoryButton = document.getElementById("famousCategory");
const usaCategoryButton = document.getElementById("usaCategory");
const germanyCategoryButton = document.getElementById("germanyCategory");
const ukCategoryButton = document.getElementById("ukCategory");
const franceCategoryButton = document.getElementById("franceCategory");
const spainCategoryButton = document.getElementById("spainCategory");
const polandCategoryButton = document.getElementById("polandCategory");
const canadaCategoryButton = document.getElementById("canadaCategory");
const swedenCategoryButton = document.getElementById("swedenCategory");
const indiaCategoryButton = document.getElementById("indiaCategory");
const mexicoCategoryButton = document.getElementById("mexicoCategory");
const italyCategoryButton = document.getElementById("italyCategory");
const ukraineCategoryButton = document.getElementById("ukraineCategory");
const dailyCategoryButton = document.getElementById("dailyCategory");
const hardCategoryButton = document.getElementById("hardCategory");

attachClickListener("standardCategory", Category.STANDARD);
attachClickListener("capitalCategory", Category.CAPITAL);
attachClickListener("famousCategory", Category.FAMOUS);
attachClickListener("usaCategory", Category.USA);
attachClickListener("germanyCategory", Category.GERMANY);
attachClickListener("ukCategory", Category.UK);
attachClickListener("franceCategory", Category.FRANCE);
attachClickListener("spainCategory", Category.SPAIN);
attachClickListener("polandCategory", Category.POLAND);
attachClickListener("canadaCategory", Category.CANADA);
attachClickListener("swedenCategory", Category.SWEDEN);
attachClickListener("indiaCategory", Category.INDIA);
attachClickListener("mexicoCategory", Category.MEXICO);
attachClickListener("italyCategory", Category.ITALY);
attachClickListener("ukraineCategory", Category.UKRAINE);
attachClickListener("dailyCategory", Category.DAILY);
attachClickListener("hardCategory", Category.HARD);

// Attach event listeners using the function
function attachClickListener(buttonId, category) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener("click", function () {
            changeCategory(category);
        });
    } else {
        console.warn(`Element with ID "${buttonId}" not found. Click listener not attached.`);
    }
}

//Change Category in the UI --------------------------------------------------------------------
function changeCategory(category) {
    standardCategoryButton.classList.add("categoryDisabled");
    capitalCategoryButton.classList.add("categoryDisabled");
    famousCategoryButton.classList.add("categoryDisabled");
    usaCategoryButton.classList.add("categoryDisabled");
    germanyCategoryButton.classList.add("categoryDisabled");
    ukCategoryButton.classList.add("categoryDisabled");
    franceCategoryButton.classList.add("categoryDisabled");
    spainCategoryButton.classList.add("categoryDisabled");
    polandCategoryButton.classList.add("categoryDisabled");
    canadaCategoryButton.classList.add("categoryDisabled");
    swedenCategoryButton.classList.add("categoryDisabled");
    indiaCategoryButton.classList.add("categoryDisabled");
    mexicoCategoryButton.classList.add("categoryDisabled");
    italyCategoryButton.classList.add("categoryDisabled");
    ukraineCategoryButton.classList.add("categoryDisabled");
    dailyCategoryButton.classList.add("categoryDisabled");
    hardCategoryButton.classList.add("categoryDisabled");

    switch (category) {
        case Category.STANDARD:
            standardCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.CAPITAL:
            capitalCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.FAMOUS:
            famousCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.USA:
            usaCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.GERMANY:
            germanyCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.UK:
            ukCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.FRANCE:
            franceCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.SPAIN:
            spainCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.POLAND:
            polandCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.CANADA:
            canadaCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.SWEDEN:
            swedenCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.INDIA:
            indiaCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.MEXICO:
            mexicoCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.ITALY:
            italyCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.UKRAINE:
            ukraineCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.DAILY:
            dailyCategoryButton.classList.remove("categoryDisabled");
            break;
        case Category.HARD:
            hardCategoryButton.classList.remove("categoryDisabled");
            break;
    }

    //refresh category if needed
    if (mapCategory !== category) {
        mapCategory = category;
        localStorage.setItem("selectedCategory", category);
    }

    checkGenerationTypeAndGenerate();
}

//Check categories and initiate location generation  ---------------------------------------------------------------------------------------------------------------

function checkGenerationTypeAndGenerate() {
    try { globalTimer.stopTimer(); } catch { }; //has to be in try catch
    setHardMode(false);
    document.getElementById("mapTimer").textContent = "00" + ":" + "00"; //reset the timer visually

    if (!multiplayer) {
        //If multiplayer is disabled
        setDailyChallengeUI(false);
        showMultiplayerOverlay(false);

        //pick between json and maps api loading depending on the category type
        if (mapCategory != "standard" && mapCategory != "daily" && mapCategory != "hard") {
            loadLocationJSON(mapCategory); //this also generates a new location
        } else if (mapCategory == "daily") {
            if (checkDailyChallengeCompletion() == "available") {
                setDailyChallengeUI(true);
                generateNewLocation("DAILY");
            } else {
                localStorage.setItem("selectedCategory", "standard");
                window.location.href = "/dailyLeaderboard.html";
            }

        } else if (mapCategory == "standard") {
            generateNewLocation("SDK");
        } else if (mapCategory == "hard") {
            setHardMode(true);
            loadLocationJSON(mapCategory);
        } else {
            console.error("Incorrect mapCategory set in categoryMenu.js under checkGenerationTypeAndGenerate.")
        }
    } else {
        //If multiplayer is enabled

        if (mapCategory != "standard" && mapCategory != "daily" && mapCategory != "hard") {
            loadLocationJSON(mapCategory); //this also generates a new location
        } else if (mapCategory == "standard") {
            generateNewLocation("SDK");
        } else {
            //if the map category is an unsupported multiplayer category, such as daily or hard, switch to standard
            changeCategory("standard"); //this will re-run checkGenerationTypeAndGenerate
        }
    }

}

//Load the map category using localstorage ---------------------------------------------------------------------

function loadMapCategory() {
    let storedSelectedCategory = localStorage.getItem("selectedCategory");

    if (storedSelectedCategory != null)
        mapCategory = storedSelectedCategory;
}

loadMapCategory();
changeCategory(mapCategory);


//Next round / new location -------------------------------------------------------------------------------------
let nextRound = document.getElementById("nextRound");
nextRound.addEventListener("click", transitionToStart);

export function transitionToStart() {

    if (!dailyChallengeUIEnabled) {
        document.getElementById("BeforeOverlay").style.opacity = "0";
        document.getElementById("BeforeOverlay").style.visibility = "visible";
        document.getElementById("BeforeOverlay").style.opacity = "100";
        resMap.stop(); //stop the flying animation
        setTimeout(function () { resMap.stop() }, 200)
        checkGenerationTypeAndGenerate();

        setTimeout(disableResultScreen, 200);
        setTimeout(socialPopupProbability, 650);
    } else {
        dailyChallengeEnd();
    }
}
