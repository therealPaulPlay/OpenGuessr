/*these imports are being handled and performed by Webpack. Note that errorHandling.js is still being included
for signupScreen.js only. LoadMap and AccountLogic are both not being included in the build folder as they are part
of the bundled main.js. */

import { resetMap, getMapSource } from './miniMap.js';
import { errorPopup} from "./errorHandling.js";
import { loadResultScreenXP } from "./accountLogic.js";
import { resultScreenEnabled, enableResultScreen } from './mainUI.js';

let lastGuessIndex = null;
let guessIndex;

//default guess coords
let currentGuessLAT = 40;
let currentGuessLONG = 40;

let listOfLocations;
let jsonResponse;


//Load location JSON files ----------------------------------------------------------------------------------------------
export async function loadLocationJSON(jsonName) {
    try {
        let response = await fetch("./JSON/" + jsonName + "Locations.json");
        if (!response.ok) {
            throw new Error("JSON fetch failed.");
        }
        
        jsonResponse = await response.json();
        listOfLocations = jsonResponse;
        
        generateNewLocation(true);
    } catch (error) {
        errorPopup("JSON error", "There was an error loading the location json file.", "JSON Fetch failed.", true);
        console.error(error); // Log the error for debugging purposes
    }
}

//Load new location ---------------------------------------------------------------------------------------------------
export function generateNewLocation(initialLoad) {
    resetMap();

    do {
        guessIndex = Math.floor(Math.random()*listOfLocations.length);      //calculating random location
    } while (lastGuessIndex === guessIndex);

    lastGuessIndex = guessIndex; //setting last Index

    //These two are the variables that reflect where the location actually is!
    currentGuessLAT = listOfLocations[guessIndex][0];
    currentGuessLONG = listOfLocations[guessIndex][1];

    if (initialLoad) {
        loadIframe(currentGuessLAT, currentGuessLONG, true);   
    } else {
        loadIframe(currentGuessLAT, currentGuessLONG, false)
    }
}

//Calculate distance to the target destination on result screen & display motivational message ---------------------------------------------------------------------
let veryCloseDistances;
let closeDistances;
let farDistances;
let extraMsg;
let destinationMarker;

export function calculateDistances(mapsLat, mapsLong) {
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
}
  
function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function compareDistances(distance) {
    //compares how big the distance is and enables result screen with a message.

    if (!resultScreenEnabled) {
   
    let finalResult;
    let resultAsString;

    veryCloseDistances = ["Rainbolt?", "How?", "Impressive.", "Let me guess; you have an A in geography?", "Wow."]
    closeDistances = ["Wow, that was very close!", "You're good at this.", "Very close!", "Almost there!"];
    farDistances = ["It was a good guess.", "You'll get it next time!", "At least it was on the correct planet, right?", "Not bad, not great."];

    if(distance < 100 && !(distance<5)) {
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
    
    loadResultScreenXP(distance);
    enableResultScreen(resultAsString, extraMsg);
    }
}

//Load result Map (resMap) ------------------------------------------------------------------------------------------------

export let resMap;

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
    L.tileLayer(getMapSource(), {
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


//Load the Main StreetView Iframe -------------------------------------------------------------------------------------------------------------
let loadingLink = "/loader.html"

export function loadIframe(lat, long, notInitialLoad) {

    loadingLink = "https://www.google.com/maps/embed/v1/streetview?location="+lat+","+long+"&key=AIzaSyDpIxJVFjMHOYsOv14lVN9Imlsh6pYI7z0&fov=90"; //API key (last part of URL)
    
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

export function reloadIframe() {
    document.getElementById("BeforeOverlay").style.opacity = "100";
    document.getElementById("BeforeOverlay").style.visibility = "visible";
    document.getElementById("GuesserWindow").setAttribute("src", loadingLink);
    window.setTimeout(() => { document.getElementById("BeforeOverlay").style.opacity = "0"; document.getElementById("BeforeOverlay").style.visibility = "hidden"; }, 400);

}

