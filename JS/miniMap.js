import { loadResultMap, calculateDistances } from "./main.js";
import { dailyChallengeUIEnabled, saveDailyChallengeCompletion, dailyChallengeTimer } from "./dailyChallenge.js";
import { selectedPinIndex } from "./accountLogic.js";
import { multiplayer, multiplayerStateToGuessed } from "./multiplayer.js";
import { hideToggleMapButtonIfMobile, isElementClickable } from "./mainUI.js";
import { playSound } from "./soundManager.js";

// Initialize the map with correct provider
const MapType = {
    STANDARD: "standard",
    SATELLITE: "satellite",
};

let marker;
let map;

export let mapsJWTToken = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjY2OEo1WkhOVDcifQ.eyJvcmlnaW4iOlsiaHR0cHM6Ly9vcGVuZ3Vlc3NyLmNvbSIsImh0dHBzOi8vZGV2Lm9wZW5ndWVzc3IuY29tIiwiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwiaHR0cHM6Ly9vZy12ZW5hdHVzLXRlc3QubmV0bGlmeS5hcHAiLCJodHRwczovL29wZW5ndWVzc3IubmV0bGlmeS5hcHAiXSwiaWF0IjoxNzE3NTM2OTcyLCJleHAiOjE3NDkwNzI5NzIsImlzcyI6IjRVUTUzTUJTSkwifQ.wm1K1wol6VYfEx0lT31MeQ8YeEqFjqqO2kUtWs0qekW0hZQ39oAYt8A6XkyD0DhteW34vLTMdzIj8uWh-Y8_hw";
export let colorArray = ["#fc1c1c", "#fc851e", "#f002c0", "#11c8d9", "#9f55fa", "#cca700"]; //pin colors (red, orange, pink...)

function initializeMap() {
    mapkit.init({
        authorizationCallback: function (done) {
            done(mapsJWTToken);
        },
        language: "en-US" //can only be changed on page load / initialization
    });

    map = new mapkit.Map("map");

    map.showsZoomControl = false;
    map.showsMapTypeControl = false;
    map._allowWheelToZoom = true;


    //hiding the compass does not work, even though it lists that option in the docs
}

// Load map type from local storage or set default
let storedMapType = localStorage.getItem("selectedMapType");
let mapType = storedMapType || MapType.STANDARD;

loadMap();
changeMapTypeButtonLabel();

export let hasGuessed = false;
setConfirmButtonState();

// reset the map - used for going to the next round.
export function resetMap() {
    if (marker) {
        map.removeAnnotation(marker);
    }

    map.region = new mapkit.CoordinateRegion(
        new mapkit.Coordinate(48, 28), // Centered around the equator and Greenwich
        new mapkit.CoordinateSpan(180, 180) // Whole world visible
    );

    // reset the guess button as well
    hasGuessed = false;
    setConfirmButtonState();
}

function changeMapTypeButtonLabel() {
    let mapTypeBaseText = "Minimap:";
    document.getElementById("mapTypeButton").innerHTML =
        `${mapTypeBaseText} ${mapType.charAt(0).toUpperCase() + mapType.slice(1)}`;
}

// Set state of the confirm ("guess") button
export function setConfirmButtonState() {
    if (hasGuessed) {
        document.getElementById("confirmButton").style.backgroundColor = "red";
        document.getElementById("confirmButton").style.color = "white";
        document.getElementById("confirmButton").style.opacity = "100%";
        document.getElementById("confirmButton").style.pointerEvents = "auto";
    } else {
        document.getElementById("confirmButton").style.backgroundColor = "white";
        document.getElementById("confirmButton").style.color = "black";
        document.getElementById("confirmButton").style.opacity = "90%";
        document.getElementById("confirmButton").style.pointerEvents = "none";
    }
}

export function setConfirmButtonEnabled() {
    hasGuessed = true;
    setConfirmButtonState();
}

// Change map type
function changeMapType() {
    mapType = mapType === MapType.STANDARD ? MapType.SATELLITE : MapType.STANDARD;
    localStorage.setItem("selectedMapType", mapType);
    changeMapTypeButtonLabel();
    loadMap();
}

// Universal map functions
function loadMap() {
    if (!map) {
        initializeMap(); // Load map with correct type
    } else {
        map.destroy();
        initializeMap();
    }

    map.mapType = mapType;

    map.region = new mapkit.CoordinateRegion(
        new mapkit.Coordinate(48, 28), // Centered around the equator and Greenwich
        new mapkit.CoordinateSpan(180, 360) // Whole world visible
    );

    //Add event listener for map click here
    map.element.addEventListener("click", function (event) {
        if (event.target.parentNode !== map.element) {
            return;
        }
        var domPoint = new DOMPoint(event.pageX, event.pageY);
        var coordinate = map.convertPointOnPageToCoordinate(domPoint);
        onMapClick(coordinate);
    });
}

// Set initial zoom level
map.region = new mapkit.CoordinateRegion(
    new mapkit.Coordinate(0, 0), // Centered around the equator and Greenwich
    new mapkit.CoordinateSpan(180, 360) // Whole world visible
);

export let mapMarkerLat = 0;
export let mapMarkerLong = 0;

function onMapClick(coordinate) {
    hasGuessed = true;
    setConfirmButtonState();
    playSound("pin_drop", "pin");

    if (marker) {
        map.removeAnnotation(marker);
    }

    // sets the variables from the USER input (this is the one that the user has placed)
    mapMarkerLat = coordinate.latitude;
    mapMarkerLong = coordinate.longitude;

    marker = new mapkit.MarkerAnnotation(coordinate, {
        color: "white",
        glyphColor: colorArray[selectedPinIndex],
        glyphImage: { 1: `./IMG/apple_your_marker${selectedPinIndex}.png` },
    });

    map.addAnnotation(marker);
}

// event listeners
const confirmBTN = document.getElementById("confirmButton");
confirmBTN.addEventListener("click", confirmButtonClicks);

// toggle map types
const mapTypeBTN = document.getElementById("mapTypeButton");
mapTypeBTN.addEventListener("click", () => {
    changeMapType();
    playSound("selection_change");
});

// Enlarge map
const mapHolder = document.getElementById("mapHolder");

function handleMapHover() {
    if (window.matchMedia("(orientation: landscape) and (min-width: 1250px)").matches) {
        mapHolder.classList.add("mapHover");
    }
}

function handleMapUnhover() {
    if (!document.getElementById("revealCompass").matches(':hover')) {
        mapHolder.classList.remove("mapHover");
    }
}

// Mouse events
document.getElementById("map").addEventListener('mouseenter', handleMapHover);
document.getElementById("map").addEventListener('mouseleave', handleMapUnhover);
document.getElementById("revealCompass").addEventListener('mouseleave', handleMapUnhover);

// Touch events
document.getElementById("map").addEventListener('touchstart', handleMapHover);
document.getElementById("map").addEventListener('touchend', handleMapUnhover);

// Guess / Confirm function
export let justPlayedDailyChallenge = false;

export function confirmButtonClicks() {
    confirmBTN.style.pointerEvents = "none"; // disable the button (will be re-enabled by setConfirmButtonState)
    playSound("confirm");

    if (dailyChallengeUIEnabled) {
        document.getElementById("nextRound").innerHTML = "See results →";
        justPlayedDailyChallenge = true;

        try {
            dailyChallengeTimer.stopTimer();
        } catch (error) {
            console.log("timer already stopped.");
        }

        saveDailyChallengeCompletion(); // set the daily challenge as completed for today (also saves the curr utc date for checking)
    } else {
        document.getElementById("nextRound").innerHTML = "Next round →";
    }

    if (!multiplayer) {
        calculateDistances(mapMarkerLat, mapMarkerLong);

        try {
            loadResultMap(mapMarkerLat, mapMarkerLong);
        } catch (error) {
            console.error("Error in confirmButton Clicks when trying to load the result map: " + error);
        }

    } else {
        document.getElementById("confirmButton").textContent = "Waiting...";
        document.getElementById("confirmButton").style.opacity = "0.5";
        document.getElementById("confirmButton").style.pointerEvents = "none";
        document.getElementById("map").style.visibility = "hidden";
        hideToggleMapButtonIfMobile(true);
        document.getElementById("revealCompass").style.visibility = "hidden";

        multiplayerStateToGuessed();
    }
}

// Confirm Button with Spacebar and a few checks
window.addEventListener("keydown", function (event) {
    if (event.key === " ") {
        if (confirmBTN.style.pointerEvents == "auto" && confirmBTN.style.visibility == "visible" && isElementClickable(document.getElementById("map"))) {
            confirmButtonClicks();
        } else {
            console.warn("Cannot click on confirm button - pointer events is none.");
        }
    }
});

