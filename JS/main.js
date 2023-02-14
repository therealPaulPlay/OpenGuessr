/* Streetview */
import { exportVariables } from "../JS/loadMap.js";

var lastGuessIndex = null;
var guessIndex;
var mapToLoad;
var currentGuessLAT = 40;
var currentGuessLONG = 40;

const response = await fetch('../JSON/locList.json');
const jsonResponse = await response.json();

const listOfLocations = Object.values(jsonResponse).flat().map(i => Object.values(i)).flat();
generateNewLocation();
startInitialization();

function generateNewLocation() {

    do {
        guessIndex = Math.floor(Math.random()*listOfLocations.length);
    } while (lastGuessIndex == guessIndex);

    lastGuessIndex = guessIndex;

    mapToLoad = listOfLocations[guessIndex];
    //currentGuessLAT = listOfLocations[guessIndex+1];             //save target latitude in var (from array)
    //currentGuessLONG = listOfLocations[guessIndex+2];            //save target longitude in var (from array)
    reloadIframe();
}

var veryCloseDistances;
var closeDistances;
var farDistances;
var resMap;
var extraMsg;

/* Map functions */

function calculateDistances(mapsLat, mapsLong) {
    var lat1 = mapsLat;
    var lon1 = mapsLong;
    var lat2 = currentGuessLAT;
    var lon2 = currentGuessLONG;
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km

    compareDistances(d);
}
  
function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function compareDistances(distance) {
    var finalResult;
    var resultAsString;

    veryCloseDistances = ["Rainbolt?", "How?", "Impressive.", "Let me guess; you have an A in geography?", "wow."]
    closeDistances = ["Wow, that was very close!", "You're good at this.", "Very close!", "Almost there!"];
    farDistances = ["It was a good guess.", "You'll get it next time!", "atleast it was on the correct planet, right?"];

    if(distance < 7 && !(distance<1)) {
        extraMsg = closeDistances[Math.floor(Math.random()*closeDistances.length)];
    }
    else {
        extraMsg = farDistances[Math.floor(Math.random()*farDistances.length)];
    }
    if (distance < 1) {
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

function setMapToTargetPosition(key, playersLat, playersLong) {
    resMap = document.getElementById("resultMap");
    resMap = L.map('resultMap').setView([currentGuessLAT, currentGuessLONG], 15); //starting position
    L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`,{ //style URL
        tileSize: 512,
        zoomOffset: -1,
        minZoom: 1,
        //attribution: "\u003ca href=\"https://www.maptiler.com/copyright/\" target=\"_blank\"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e",
        crossOrigin: true
    }).addTo(resMap);

    var redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    var latlng = L.latLng(currentGuessLAT, currentGuessLONG);
    L.marker(latlng, {icon: redIcon}).addTo(resMap);

    var curLatLng = new L.LatLng(currentGuessLAT, currentGuessLONG);
    var playerLatLng = new L.LatLng(playersLat, playersLong);
    var polyList = [curLatLng, playerLatLng];
    var pointList = new L.LatLngBounds([curLatLng, playerLatLng]);

    resMap.fitBounds(pointList);
    
    var polygon = L.polygon(polyList, {color: '#05060ab0', weight: '3',  dashArray: '10, 10', dashOffset: '-10'}).addTo(resMap);
    
    L.marker(playerLatLng, {icon: redIcon}).addTo(resMap);
}

function enableResultScreen(resultString, extraMessage) {
    document.getElementById("map").style.visibility = "hidden";
    document.getElementById("EndOverlay").style.visibility = "visible";
    document.getElementById("EndOverlay").zIndex = "12";
    document.getElementById("EndOverlay").style.opacity = "100";

    document.getElementById("confirmButton").style.visibility = "hidden";
    document.getElementById("resetButtonSVG").style.visibility = "hidden";

    document.getElementById("logo").setAttribute("pointer-events", "none");

    document.getElementById("distanceText").innerText = "Your guess was "+resultString+" away from the target.";
    document.getElementById("motivationText").innerText = extraMessage;
}

function reloadIframe() {
    document.getElementById("GuesserWindow").setAttribute("src", mapToLoad);
    window.setTimeout(() => { document.getElementById("BeforeOverlay").style.opacity = 0; document.getElementById("BeforeOverlay").style.visibility = "hidden"; }, 200);
}

function transitionToStart() {
    document.getElementById("BeforeOverlay").style.opacity = 0;
    document.getElementById("BeforeOverlay").style.visibility = "visible";
    document.getElementById("BeforeOverlay").style.opacity = 100;
    window.setTimeout(() => {
        window.location.reload();
    }, 200);
}

function startInitialization(){
    var resetBTN = document.getElementById("resetButtonSVG");
    resetBTN.addEventListener("click", reloadIframe);
    var logoBTN = document.getElementById("logo");
    logoBTN.addEventListener("click", generateNewLocation);
    var confirmBTN = document.getElementById("confirmButton");
    confirmBTN.addEventListener("click", calculateDistances(exportVariables.markPos.lat, exportVariables.markPos.lng), setMapToTargetPosition(exportVariables.keyX, exportVariables.latX, exportVariables.longX));
}

