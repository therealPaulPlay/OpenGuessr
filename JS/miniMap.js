import { loadResultMap, calculateDistances } from "./main.js";
import { dailyChallengeUIEnabled, saveDailyChallengeCompletion, dailyChallengeTimer } from "./dailyChallenge.js";
import { selectedPinIndex } from "./accountLogic.js";
import { multiplayer, multiplayerStateToGuessed } from "./multiplayer.js";
import { hideToggleMapButtonIfMobile } from "./mainUI.js";


//Initialize the map with correct provider --------------------------------------------------------------------
const Provider = {
    ENGLISH: "0",
    GERMAN: "1",
    REGIONAL: "2",
    TOPOGRAPHIC: "3",
}

let map = L.map('map', { zoomControl: false }).setView([40.321160, 10.252812], 1.5); //starting position

let mapProvider = ["https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", "https://tile.openstreetmap.de/{z}/{x}/{y}.png", "https://tile.openstreetmap.org/{z}/{x}/{y}.png", "https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png"]

//English should be the new default!
let providerIndex = Provider.ENGLISH;
let storedProviderIndex = localStorage.getItem("providerIndex");

if (storedProviderIndex != null) {
    providerIndex = storedProviderIndex;
}

export function getMapSource() {
    return mapProvider[providerIndex];
}

loadMap();
changeLanguageButtonLabel();

//indicate whether a guess has been made and the button can be used
export let hasGuessed = false;
setConfirmButtonState();

//reset the map - used for going to the next round. 
export function resetMap() {
    map.removeLayer(marker);
    map.setZoom(3);

    //reset the guess button as well
    hasGuessed = false;
    setConfirmButtonState();
}

function changeLanguageButtonLabel() {
    let mapTypeBaseText = "Map Type:";
    switch (providerIndex) {
        case "0": document.getElementById("languageButton").innerHTML = `${mapTypeBaseText} English`;
            break;

        case "1": document.getElementById("languageButton").innerHTML = `${mapTypeBaseText} German`;
            break;

        case "2": document.getElementById("languageButton").innerHTML = `${mapTypeBaseText} Regional`;
            break;

        case "3": document.getElementById("languageButton").innerHTML = `${mapTypeBaseText} Topographic`;
            break;

        default: document.getElementById("languageButton").innerHTML = `${mapTypeBaseText} English`;
            break;
    }
}

//Set state of the confirm ("guess") button ------------------------------------------------------------------
export function setConfirmButtonState() {
    if (hasGuessed) {
        document.getElementById("confirmButton").style.backgroundColor = "red";
        document.getElementById("confirmButton").style.color = "white";
        document.getElementById("confirmButton").style.opacity = "100%"
        document.getElementById("confirmButton").style.pointerEvents = "auto";
    }
    else {
        document.getElementById("confirmButton").style.backgroundColor = "white";
        document.getElementById("confirmButton").style.color = "black";
        document.getElementById("confirmButton").style.opacity = "90%"
        document.getElementById("confirmButton").style.pointerEvents = "none";
    }
}

export function setConfirmButtonEnabled() {
    hasGuessed = true;
    setConfirmButtonState();
}

//Change map provider / language ---------------------------------------------------------------------
function changeLanguage() {
    switch (providerIndex) {
        case Provider.ENGLISH:
            providerIndex = Provider.GERMAN;
            break;
        case Provider.GERMAN:
            providerIndex = Provider.REGIONAL;
            break;
        case Provider.REGIONAL:
            providerIndex = Provider.TOPOGRAPHIC;
            break;
        default:
            providerIndex = Provider.ENGLISH;
    }
    localStorage.setItem("providerIndex", providerIndex);

    changeLanguageButtonLabel();
    resetGuessMap();
}


//Universal map functions --------------------------------------------------------------------
let osmLayer;

function loadMap() {
    osmLayer = L.tileLayer(mapProvider[providerIndex], {
        attribution: '© CARTO © OpenStreetMap © Geodatenzentrum',
        noWrap: true,
    }).addTo(map);
}

function destroyMap() {
    map.removeLayer(osmLayer);
}

function resetGuessMap() {
    destroyMap();
    loadMap();
}

map.setZoom(3);

let marker = new L.Marker([0, 0]);


//Placing the marker on the map ------------------------------------------------------------------------
export let mapMarkerLat = 0;
export let mapMarkerLong = 0;

function onMapClick(e) {
    //creates markers wherever the user clicks and if it clicks to another position,
    //delete the old one and also save the position in latitudes and longitudes

    hasGuessed = true;
    setConfirmButtonState();

    if (marker) {
        map.removeLayer(marker);
    }
    //sets the variables from the USER input (this is the one that the user has placed)
    mapMarkerLat = e.latlng.lat;
    mapMarkerLong = e.latlng.lng;

    const redIcon = new L.Icon({
        iconUrl: "./IMG/your_marker" + selectedPinIndex + ".png",
        iconSize: [40, 40],
        iconAnchor: [20, 38],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    marker = new L.Marker([mapMarkerLat, mapMarkerLong], { icon: redIcon });
    marker.addTo(map);
}

//event listeners -----------------------------------------------------------------
//click listener for confirm button
const confirmBTN = document.getElementById("confirmButton");
confirmBTN.addEventListener("click", confirmButtonClicks);

//toggle languages
const languageBTN = document.getElementById("languageButton");
languageBTN.addEventListener("click", changeLanguage);

//Reset map scaling when the user "enlarges" it --------------------------------------------------------------
map.on('click', onMapClick);

let useLegacyMouseOver = false;

//this is for legacy browsers that do not support resizeObservers
if (useLegacyMouseOver) {
    map.on('mouseover', onMapHover);
    map.on('mouseout', onMapHover);
}

function onMapHover() {
    map.invalidateSize();
}
try {
    new ResizeObserver(onMapHover).observe(document.getElementById("map"));
} catch (error) {
    console.error("Resize oberser unsupported. Err: " + error);
    useLegacyMouseOver = true;
}

//Guess / Confirm function ----------------------------------------------------------------------------------
export let justPlayedDailyChallenge = false;

export function confirmButtonClicks() {
    confirmBTN.style.pointerEvents = "none"; //disable the button (will be re-enabled by setConfirmButtonState)

    if (dailyChallengeUIEnabled) {
        document.getElementById("nextRound").innerHTML = "See results →";
        justPlayedDailyChallenge = true;

        try {
            dailyChallengeTimer.stopTimer();
        } catch (error) {
            console.log("timer already stopped.");
        }

        saveDailyChallengeCompletion(); //set the daily challenge as completed for today (also saves the curr utc date for checking)
    } else {
        document.getElementById("nextRound").innerHTML = "Next round →";
    }

    if (!multiplayer) {
        calculateDistances(mapMarkerLat, mapMarkerLong);
        loadResultMap(mapMarkerLat, mapMarkerLong);
    } else {
        document.getElementById("confirmButton").textContent = "Waiting...";
        document.getElementById("confirmButton").style.opacity = "0.5";
        document.getElementById("confirmButton").style.pointerEvents = "none";
        document.getElementById("map").style.pointerEvents = "none";
        document.getElementById("map").style.visibility = "hidden";
        hideToggleMapButtonIfMobile(true);
        document.getElementById("revealCompass").style.visibility = "hidden";

        multiplayerStateToGuessed();
    }
}

//Confirm Button with Spacebar and a few checks
document.getElementById("map").addEventListener("keydown", function (event) {
    if (event.key === " ") {
        if (confirmBTN.style.pointerEvents == "auto") {
            confirmButtonClicks();
        } else {
            console.warn("Cannot click on confirm button - pointer events is none.");
        }
    }
});
