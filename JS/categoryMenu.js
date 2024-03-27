import { loadLocationJSON } from "./locationGeneration.js";
import { resMap, generateNewLocation } from "./main.js";
import { disableResultScreen, socialPopupProbability } from "./mainUI.js";

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
    DAILY: "daily"
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
const dailyCategoryButton = document.getElementById("dailyCategory");

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
attachClickListener("dailyCategory", Category.DAILY);

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
    dailyCategoryButton.classList.add("categoryDisabled");

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
        case Category.DAILY:
            dailyCategoryButton.classList.remove("categoryDisabled");
            break;
    }

    //refresh category if needed
    if (mapCategory !== category) {
        mapCategory = category;
        localStorage.setItem("selectedCategory", category);
    }

    checkGenerationTypeAndGenerate();
}

function checkGenerationTypeAndGenerate() {
    //pick between json and maps api loading depending on the category type
    if (mapCategory != "standard" && mapCategory != "daily") {
        loadLocationJSON(mapCategory); //this also generates a new location
    } else if (mapCategory != "standard") {
        generateNewLocation("DAILY");
    } else if (mapCategory == "standard") {
        generateNewLocation("SDK");
    } else {
        console.error("Incorrect mapCategory set in cateGoryMenu.js under checkGenerationTypeAndGenerate.")
    }
}

//Load the map category using localstorage ----------------------------------------------------------------

function loadMapCategory() {
    let storedSelectedCategory = localStorage.getItem("selectedCategory");

    if (storedSelectedCategory != null)
        mapCategory = storedSelectedCategory;
}

loadMapCategory();
changeCategory(mapCategory);


//Next round / new location ---------------------------------------------------------------------------------
let nextRound = document.getElementById("nextRound");
nextRound.addEventListener("click", transitionToStart);

export function transitionToStart() {

    document.getElementById("BeforeOverlay").style.opacity = "0";
    document.getElementById("BeforeOverlay").style.visibility = "visible";
    document.getElementById("BeforeOverlay").style.opacity = "100";
    resMap.stop(); //stop the flying animation
    setTimeout(function () { resMap.stop() }, 200)
    checkGenerationTypeAndGenerate();

    setTimeout(disableResultScreen, 200);
    setTimeout(socialPopupProbability, 650);
}

