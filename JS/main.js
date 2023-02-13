/* Streetview */


/* old way
const listOfLocations = 
[
    //add another with , "ID"
    ["1soXtvTZQnaDps7DiEzfmS_w", "1sKXeRMS-trz0KmbYW2CwLjw", "1skEt7-PRRe2_q98SKOVAFSg", "1shSaYZxEVIl2aK0r8N2uQGQ", "1sobLPO0hdHW6teqPr9G6yzQ", "1sbX8q8maSJ_YOf63hMTiY0g", "1sWxtpU4_3jB_zFf9fm5FjDg"],
    //add another with "[[LAT],[LONG]], "
    [[[48.2663934],[16.4485618]], [[48.1294301],[14.8078931]] ,[[46.9578485],[7.4406567]], [[43.7758559],[-79.3437756]], [[48.1995556],[16.3680908]], 
    [[46.9578485],[7.4406567]], [[48.1864604],[16.3505445]]]
];
*/

const response = await fetch('../JSON/locList.json');
var jsonResponse = await response.json();
const jsonResponseAsArray = Object.entries(jsonResponse);

const listOfLocations = jsonResponseAsArray[0][1];

var lastGuessIndex = null;
var guessIndex;
var mapToLoad;
var currentGuessLAT;
var currentGuessLONG;

generateNewLocation();

function generateNewLocation() {
    console.log(listOfLocations[0]);


    do {
        guessIndex = Math.floor(Math.random()*listOfLocations[0].length);
    } while (lastGuessIndex == guessIndex);

    lastGuessIndex = guessIndex;


    /*
    mapToLoad = listOfLocations[0][guessIndex];
    currentGuessLAT = listOfLocations[1][guessIndex][0][0];             //save target latitude in var (from array)
    currentGuessLONG = listOfLocations[1][guessIndex][1][0];            //save target longitude in var (from array)*/
    reloadIframe();
}

function reloadIframe() {
    document.getElementById("GuesserWindow").setAttribute("src", "https://www.google.com/maps/embed?pb=!!6m8!1m7!"+mapToLoad+"!2m2!!!!!");
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

function loadFromHTML(listArray) {
    listOfLocations = listArray;
}

var veryCloseDistances;
var closeDistances;
var farDistances;
var resMap;

/* Map functions */

function calculateDistances(mapsLat, mapsLong) {
    lat1 = mapsLat;
    lon1 = mapsLong;
    lat2 = currentGuessLAT;
    lon2 = currentGuessLONG;
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    d = R * c; // Distance in km

    veryCloseDistances = ["Rainbolt?", "How?", "Impressive.", "Let me guess; you have an A in geography?", "wow."]
    closeDistances = ["Wow, that was very close!", "You're good at this.", "Very close!", "Almost there!"];
    farDistances = ["It was a good guess.", "You'll get it next time!", "atleast it was on the correct planet, right?"];

    compareDistances(d);
}
  
function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function compareDistances(distance) {
    var finalResult;
    var resultAsString;

    if(distance < 7 && !(distance<1)) {
        extraMsg = closeDistances[Math.floor(Math.random()*closeDistances.length)];
    }
    else {
        extraMsg = farDistances[Math.floor(Math.random()*farDistances.length)];
    }
    if (distance < 1) {
        finalResult = Math.round(d*1000);
        resultAsString = finalResult+" m";
        extraMsg = veryCloseDistances[Math.floor(Math.random()*veryCloseDistances.length)];
    }
    else {
        finalResult = Math.round(d * 10) / 10;
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
