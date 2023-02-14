const key = 'QADiAuIEfpISv0PGS7Ju';
//const map = L.map('map').setView([35.321160, -40.252812], 1.5); //starting position
/*
L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`,{ //style URL
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    //attribution: "\u003ca href=\"https://www.maptiler.com/copyright/\" target=\"_blank\"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e",
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

    if (marker) {
        map.removeLayer(marker);
    }
    lat = e.latlng.lat;
    long = e.latlng.lng;

    marker = new L.Marker([lat, long], {icon: redIcon});

    markerPosition = marker.getLatLng();
    marker.addTo(map);
}

map.on('click', onMapClick);*/