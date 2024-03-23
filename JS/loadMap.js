import { setMapToTargetPosition } from "./main.js";
import { calculateDistances } from "./main.js";

const Provider = {
    ENGLISH: "0",
    GERMAN: "1",
    REGIONAL: "2",
}

//initializes map (check out leaflet for more information)
let map = L.map('map', {zoomControl: false}).setView([40.321160, 10.252812], 1.5); //starting position

let mapProvider = ["https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", "https://tile.openstreetmap.de/{z}/{x}/{y}.png", "https://tile.openstreetmap.org/{z}/{x}/{y}.png"]

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
let hasGuessed = false;
setConfirmButtonState();

//reset the map - used in main.js for going to the next round. 
export function resetMap() {
    map.removeLayer(marker);
    map.setZoom(3);
    hasGuessed = false;
    setConfirmButtonState();
}

function changeLanguageButtonLabel () {
       switch (providerIndex) {
        case "0": document.getElementById("languageButton").innerHTML = "Map language: English";
        break;

        case "1": document.getElementById("languageButton").innerHTML = "Map language: German";
        break; 

        case "2": document.getElementById("languageButton").innerHTML = "Map language: Regional";
        break;

        default: document.getElementById("languageButton").innerHTML = "Map language: English";
        break;
       }
}

function setConfirmButtonState() {
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

function changeLanguage () {
    if (providerIndex == Provider.ENGLISH) {
        providerIndex = Provider.GERMAN;
    }
    else if (providerIndex == Provider.GERMAN) {
        providerIndex = Provider.REGIONAL;
    }
    else {
        providerIndex = Provider.ENGLISH;
    }
    localStorage.setItem("providerIndex", providerIndex);
    
    changeLanguageButtonLabel();
    resetGuessMap();
    
    /* window.location.reload(); */
}

let osmLayer;

function loadMap() {
  osmLayer = L.tileLayer(mapProvider[providerIndex], {
      attribution: 'https://www.openstreetmap.org/copyright',
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

const redIcon = new L.Icon({
    iconUrl: './IMG/your_marker.png',
    iconSize: [40, 40],
    iconAnchor: [20, 38],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

let marker = new L.Marker([0, 0]);
let markerPosition = marker.getLatLng();
let lat;
let long;

function onMapClick(e) {
    //creates markers wherever the user clicks and if it clicks to another position,
    //delete the old one and also save the position in latitudes and longitudes

    hasGuessed = true;
    setConfirmButtonState();

    if (marker) {
        map.removeLayer(marker);
    }
    //sets the variables from the USER input (this is the one that the user has placed)
    lat = e.latlng.lat;
    long = e.latlng.lng;

    marker = new L.Marker([lat, long], {icon: redIcon});

    markerPosition = marker.getLatLng();
    marker.addTo(map);
}

map.on('click', onMapClick);

map.on('mouseover', onMapHover);
map.on('mouseout', onMapHover);

map.addEventListener("mouseover", onMapHover);
map.addEventListener("mouseout", onMapHover);


//click listener to make the confirm button work
const confirmBTN = document.getElementById("confirmButton");
confirmBTN.addEventListener("click", confirmButtonClicks);

//toggle languages
const languageBTN = document.getElementById("languageButton");
languageBTN.addEventListener("click", changeLanguage);


function onMapHover() {
    map.invalidateSize();
}

export function confirmButtonClicks() {
    //calls functions since you can't pass parameters from a function outside of the file. Note: you can, with export variables
    calculateDistances(markerPosition.lat, markerPosition.lng);
    setMapToTargetPosition(lat, long);
}
