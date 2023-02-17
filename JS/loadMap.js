import "../JS/main.js";
import { setMapToTargetPosition } from "./main.js";
import { calculateDistances } from "./main.js";

//initializes map (check out leaflet for more information)

const key = 'QADiAuIEfpISv0PGS7Ju';
const map = L.map('map').setView([35.321160, -40.252812], 1.5); //starting position
L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`,{ //style URL
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: "\u003ca href=\"https://www.maptiler.com/copyright/\" target=\"_blank\"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e",
    crossOrigin: true
}).addTo(map);

var redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

var marker = new L.Marker([0, 0]);
var markerPosition = marker.getLatLng();
var lat;
var long;

function onMapClick(e) {
    //creates markers wherever the user clicks and if it clicks to another position,
    //delete the old one and also save the position in latitudes and longitudes

    if (marker) {
        map.removeLayer(marker);
    }
    lat = e.latlng.lat;
    long = e.latlng.lng;

    marker = new L.Marker([lat, long], {icon: redIcon});

    markerPosition = marker.getLatLng();
    marker.addTo(map);
}

map.on('click', onMapClick);
//map.on('mouseover', onMapHover);

map.addEventListener("mouseover", onMapHover);

//click listener to make the confirm button work
var confirmBTN = document.getElementById("confirmButton");
confirmBTN.addEventListener("click", confirmButtonClicks);


function onMapHover(e) {
    map.invalidateSize();
}

export function confirmButtonClicks() {
    //calls functions since you can't pass parameters from a function outside of the file.
    calculateDistances(markerPosition.lat, markerPosition.lng);
    setMapToTargetPosition(key, lat, long);
}