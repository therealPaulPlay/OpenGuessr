import "../JS/main.js";
import { setMapToTargetPosition } from "./main.js";
import { calculateDistances } from "./main.js";

//initializes map (check out leaflet for more information)

const key = 'QADiAuIEfpISv0PGS7Ju';
const map = L.map('map').setView([35.321160, -40.252812], 1.5); //starting position

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    
    attribution: 'http://www.openstreetmap.org/copyright',
    detectRetina: true
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
    //sets the variables from the USER input (this is the one that the user has placed)
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