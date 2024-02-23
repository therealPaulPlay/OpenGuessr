import { resetMap } from './loadMap.js';
import { errorPopup } from "./errorHandling.js";
import { loadResultScreenXP } from "./logto.js";
//IMPORTANT: Main.js is now part of the bundled.js (webpack) using functions from logto.js/bundled.js otherwise causes issues

let lastGuessIndex = null;
let guessIndex;

//this is the new default mapToLoad which displays a proper error message instead of a random street view that we have picked
let currentGuessLAT = 40;
let currentGuessLONG = 40;

//get the map category and read json accordingly!

const Category = {
    STANDARD: "standard",
    CAPITAL: "capital",
    FAMOUS: "famous",
    USA: "usa"
}

let mapCategory = Category.STANDARD;

//category buttons - this has to be on top because these variables are needed below
//note to myself: ALWAYS double check the IDs! It breaks everything if they are wrong (like literally everything)
const standardCategoryButton = document.getElementById("standardCategory");
standardCategoryButton.addEventListener("click", function() {
    changeCategory(Category.STANDARD);
});

const capitalCategoryButton = document.getElementById("capitalCategory");
capitalCategoryButton.addEventListener("click", function() {
    changeCategory(Category.CAPITAL);
});

const famousCategoryButton = document.getElementById("famousCategory");
famousCategoryButton.addEventListener("click", function() {
    changeCategory(Category.FAMOUS);
});

const usaCategoryButton = document.getElementById("usaCategory");
usaCategoryButton.addEventListener("click", function() {
    changeCategory(Category.USA);
});

//load the map category initially
loadMapCategory();

//change the category in the UI
changeCategory(mapCategory);

//loads the mapCategory from LocalStorage
function loadMapCategory() {
    let storedSelectedCategory = localStorage.getItem("selectedCategory");

    if (storedSelectedCategory != null)
        mapCategory = storedSelectedCategory;
}

let listOfLocations;
let jsonResponse;

async function loadLocationJsonAndGenerateLocation() {
    let response = await fetch("../JSON/" + mapCategory + "Locations.json");
    jsonResponse = await response.json();
    listOfLocations = jsonResponse;
    
    generateNewLocation(true);    
}            

enableClickListeners();

function generateNewLocation(initialLoad) {
    resetMap();

    do {
        guessIndex = Math.floor(Math.random()*listOfLocations.length);      //calculating random location
    } while (lastGuessIndex === guessIndex);

    lastGuessIndex = guessIndex; //setting last Index

    //These two are the variables that reflect where the location actually is!
    currentGuessLAT = listOfLocations[guessIndex][0]; //saves lats and longs in separate variables
    currentGuessLONG = listOfLocations[guessIndex][1];

    validateCoordinates();
    if (initialLoad) {
        reloadIframe(true);   
    } else {
        reloadIframe(false)
    }
    //now the map is generated, the iFrame is being reloaded.
}

function validateCoordinates () {
    if (isNaN(currentGuessLAT) || isNaN(currentGuessLONG)) {
        errorPopup("Wrong coordinates from Array", "The coordinates from this streetview are invalid.", "Lat: "+currentGuessLAT+" Long: "+currentGuessLONG+".");
    }
}

let veryCloseDistances;
let closeDistances;
let farDistances;
let extraMsg;
let destinationMarker;

/* Map functions */

export function calculateDistances(mapsLat, mapsLong) {
    //calculates distance between set point and actual point.
    let lat1 = mapsLat;
    let lon1 = mapsLong;
    let lat2 = currentGuessLAT;
    let lon2 = currentGuessLONG;
    let R = 6371; // Radius of the earth in km
    let dLat = deg2rad(lat2-lat1);  // deg2rad below
    let dLon = deg2rad(lon2-lon1); 
    let a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    let d = R * c; // Distance in km

    compareDistances(d);   
    loadResultScreenXP(d);
}
  
function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function compareDistances(distance) {
    //compares how big the distance is and enables result screen with a message.

    let finalResult;
    let resultAsString;

    veryCloseDistances = ["Rainbolt?", "How?", "Impressive.", "Let me guess; you have an A in geography?", "Wow."]
    closeDistances = ["Wow, that was very close!", "You're good at this.", "Very close!", "Almost there!"];
    farDistances = ["It was a good guess.", "You'll get it next time!", "At least it was on the correct planet, right?"];

    if(distance < 20 && !(distance<1)) {
        extraMsg = closeDistances[Math.floor(Math.random()*closeDistances.length)];
    }
    else {
        extraMsg = farDistances[Math.floor(Math.random()*farDistances.length)];
    }
    if (distance < 5) {
        finalResult = Math.round(distance*1000);
        resultAsString = finalResult+" m";
        extraMsg = veryCloseDistances[Math.floor(Math.random()*veryCloseDistances.length)];
    }
    else {
        finalResult = Math.round(distance * 10) / 10;
        resultAsString = finalResult+" km";
    }

    enableResultScreen(resultAsString, extraMsg);
}

let resMap;

export function setMapToTargetPosition(playersLat, playersLong) {
   //this deletes the map only if it already exists - otherwise it will never exist - important for going to the next round
    if (resMap && resMap.remove) {
        resMap.off();
        resMap.remove();
      }

    //this makes it so the map in the result screen is focused on the center between the point
    //and zooming out so both points are visible on the map.
    resMap = document.getElementById("resultMap");
    resMap = L.map('resultMap').setView([currentGuessLAT, currentGuessLONG], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'https://www.openstreetmap.org/copyright'
}).addTo(resMap);

const redIcon = new L.Icon({
    iconUrl: './IMG/your_marker.png',
    iconSize: [40, 40],
    iconAnchor: [20, 38],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
    iconUrl: './IMG/result_marker.png',
    iconSize: [40, 40],
    iconAnchor: [20, 38],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

    //used to create the line between the points
    let curLatLng = new L.LatLng(currentGuessLAT, currentGuessLONG);
    let playerLatLng = new L.LatLng(playersLat, playersLong);
    let polyList = [curLatLng, playerLatLng];
    let pointList = new L.LatLngBounds([curLatLng, playerLatLng]);
    let playerMarker;
    
    //this places the Player Marker (where the player thinks the location is)
    playerMarker = new L.Marker(playerLatLng, {icon: redIcon})
    playerMarker.addTo(resMap);
    const polygon = L.polygon(polyList, {color: '#05060ab0', weight: '3',  dashArray: '10, 10', dashOffset: '-10'}).addTo(resMap);

    resMap.fitBounds(pointList, {padding: [150,250]});

    //this places the "correct" marker that actually reflects the target location
    destinationMarker = new L.Marker([currentGuessLAT, currentGuessLONG], {icon: greenIcon});
    destinationMarker.addTo(resMap);

    setTimeout(flyToDestination, 1000)
}

function flyToDestination() {
    if (document.getElementById("EndOverlay").style.opacity == "1") {
    resMap.flyTo([currentGuessLAT, currentGuessLONG], clamp(resMap.getZoom() + 4,0,18), {
        animate: true, 
        duration: 2
     });
    }
}

//clamp function 
function clamp(num, min, max) {
    return num <= min 
      ? min 
      : num >= max 
        ? max 
        : num
  }

//enables the result screen.
function enableResultScreen(resultString, extraMessage) {

    document.getElementById("EndOverlay").style.opacity = "100%";
    document.getElementById("EndOverlay").style.visibility = "visible";

    document.getElementById("BottomBar").style.visibility = "hidden";
    document.getElementById("map").style.visibility = "hidden";

    document.getElementById("logo").style.pointerEvents = "none";

    document.getElementById("distanceText").innerText = "Your guess was "+resultString+" away from the target.";
    document.getElementById("motivationText").innerText = extraMessage;
}

function disableResultScreen() {
    document.getElementById("EndOverlay").style.opacity = "0%";
    setTimeout(document.getElementById("EndOverlay").style.visibility = "hidden", 200)

    document.getElementById("BottomBar").style.visibility = "visible";
    document.getElementById("map").style.visibility = "visible";
    document.getElementById("logo").style.pointerEvents = "auto";
}

function reloadIframe(notInitialLoad) {
    let loadingLink;
    loadingLink = "https://www.google.com/maps/embed/v1/streetview?location="+currentGuessLAT+","+currentGuessLONG+"&key=AIzaSyDpIxJVFjMHOYsOv14lVN9Imlsh6pYI7z0"; //API key (last part of URL) is only valid for the embed API and only for the openguessr & locahost:3000 domains.
    
    if (!notInitialLoad) {
         //if it is the inital load - reloads the iFrame and sets the position of the camera back to it's origin.
        document.getElementById("GuesserWindow").setAttribute("src", loadingLink);
        window.setTimeout(() => { document.getElementById("BeforeOverlay").style.opacity = "0"; document.getElementById("BeforeOverlay").style.visibility = "hidden"; }, 200);
    }
    else {
        document.getElementById("BeforeOverlay").style.opacity = "100";
        document.getElementById("BeforeOverlay").style.visibility = "visible";
        document.getElementById("GuesserWindow").setAttribute("src", loadingLink);
        window.setTimeout(() => { document.getElementById("BeforeOverlay").style.opacity = "0"; document.getElementById("BeforeOverlay").style.visibility = "hidden"; }, 400);
    }
   
}

function transitionToStart() {
    //fancy function to make a fade in to prevent the flashing of the iframe.
    document.getElementById("BeforeOverlay").style.opacity = "0";
    document.getElementById("BeforeOverlay").style.visibility = "visible";
    document.getElementById("BeforeOverlay").style.opacity = "100";
    resMap.stop(); //stop the flying animation
    setTimeout(function() {resMap.stop()}, 200)
    generateNewLocation(true); 
    
    //Fade the result screen out when the streetview is loaded to prevent flashing
    setTimeout(disableResultScreen, 200);
}

//Navbar Buttons
function goToReddit() {
    window.open("https://www.reddit.com/r/OpenGuessr/", '_blank').focus();
}

function goToLegal() {
    window.location.href = "/legal.html";
}

//Unfold the second navbar for categories
let extendedNavbar = document.getElementById("extendedNavbar");
let categoryMenuButton = document.getElementById("categoryMenuButton");

categoryMenuButton.addEventListener("click", function() {
    // Toggle the visibility of the extended navbar
    if (extendedNavbar.classList.contains("expanded")) {
        setTimeout(function() {
            categoryMenuButton.style.top = "85px";
        }, 110); // Delay the button animation by 110ms so that it smoothly retracts with the navbar
        extendedNavbar.classList.remove("expanded");
        categoryMenuButton.innerText = "Map Categories ▼";
    } else {
        categoryMenuButton.style.top = "270px";
        extendedNavbar.classList.add("expanded");
        categoryMenuButton.innerText = "Map Categories ▲";
    }
});

function changeCategory(category) {
    //disable all
    standardCategoryButton.classList.add("categoryDisabled");
    capitalCategoryButton.classList.add("categoryDisabled");
    famousCategoryButton.classList.add("categoryDisabled");
    usaCategoryButton.classList.add("categoryDisabled");
    
   //enable the correct one
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
    }

    if(mapCategory !== category) {
        mapCategory = category;
        localStorage.setItem("selectedCategory", category);
    }

    loadLocationJsonAndGenerateLocation().then();
}


function enableClickListeners(){
    let resetBTN = document.getElementById("resetButtonSVG");
    resetBTN.addEventListener("click", function() {reloadIframe(true)});
   
    let logoBTN = document.getElementById("logo");
    logoBTN.addEventListener("click", function() {generateNewLocation(true)});
  
    let nextRound = document.getElementById("nextRound");
    nextRound.addEventListener("click", transitionToStart);
   
    let socialRedditButton = document.getElementById("socialsButton");
    socialRedditButton.addEventListener("click", goToReddit);

    let privacyButton = document.getElementById("privacyButton");
    privacyButton.addEventListener("click", goToLegal);
}