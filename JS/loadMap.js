import "../JS/main.js";
import { setMapToTargetPosition } from "./main.js";
import { calculateDistances } from "./main.js";

const Provider = {
    REGIONAL: 0,
    GERMAN: 1
}

//initializes map (check out leaflet for more information)

const map = L.map('map').setView([35.321160, -40.252812], 1.5); //starting position

let mapProvider = ["https://tile.openstreetmap.org/{z}/{x}/{y}.png", "https://tile.openstreetmap.de/{z}/{x}/{y}.png"]

//TODO switch to enum
let providerIndex = Provider.REGIONAL;
let storedProviderIndex = localStorage.getItem("providerIndex");

if (storedProviderIndex != null)
    providerIndex = storedProviderIndex;

changeLanguageButtonLabel();

//indicate whether a guess has been made and the button can be used
let hasGuessed = false;
setConfirmButtonState();

function changeLanguageButtonLabel () {
       document.getElementById("languageButton").innerHTML = `Map language: ${providerIndex === Provider.REGIONAL ? "Regional": "German"}`
}

function setConfirmButtonState() {
    if (hasGuessed) {
        document.getElementById("confirmButton").style.backgroundColor = "red";
        document.getElementById("confirmButton").style.pointerEvents = "auto";
    }
    else {
        document.getElementById("confirmButton").style.backgroundColor = "#282828";
        document.getElementById("confirmButton").style.pointerEvents = "none";
    }
}

function changeLanguage () {
    if (providerIndex === Provider.REGIONAL) {
        providerIndex = Provider.GERMAN;
    }
    else {
        providerIndex = Provider.REGIONAL;
    }
    localStorage.setItem("providerIndex", providerIndex);
    window.location.reload();
}

L.tileLayer(mapProvider[providerIndex], {
    attribution: 'https://www.openstreetmap.org/copyright',
    noWrap: true
}).addTo(map);

map.setZoom(3);

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
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
    //calls functions since you can't pass parameters from a function outside of the file.
    calculateDistances(markerPosition.lat, markerPosition.lng);
    setMapToTargetPosition(lat, long);
}