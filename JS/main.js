var lastGuessIndex = null;
var guessIndex;
var mapToLoad;
var currentGuessLAT = 40;
var currentGuessLONG = 40;

//reading in JSON

const response = await fetch('../JSON/locList.json');
const jsonResponse = await response.json();

const listOfLocations = Object.values(jsonResponse).flat().map(i => Object.values(i)).flat();

generateNewLocation();                                                      //call start functions after JSON is loaded
enableClickListeners();

function generateNewLocation() {
    do {
        guessIndex = Math.floor(Math.random()*listOfLocations.length);      //calculating random location
    } while (lastGuessIndex == guessIndex);

    lastGuessIndex = guessIndex;                                            //setting last Index

    mapToLoad = listOfLocations[guessIndex];                                //declares which map is being loaded

    var currentGuessLatArray = [];                                          //creation of 2 arrays that temporarily store
    var currentGuessLngArray = [];                                          //lat and long values taken from link

    var secondIndex = 0;                                                    //declares where longitudes start

    if (mapToLoad.length > 140) {
        for (let i = 93; i < mapToLoad.length; i++) {                       //cut away unnecessary parts of link to get latitude
            if (mapToLoad[i] != "!") {
                currentGuessLatArray[i] = mapToLoad[i];
            }
            else {
                secondIndex = i+3;                                          //declares where the longitudes are starting
                break;
            }
        }
        for (let j = secondIndex; j < mapToLoad.length; j++) {              //cut away unnecessary parts of link to get longitude
            if (mapToLoad[j] != "!") {
                currentGuessLngArray[j] = mapToLoad[j];
            }
            else {
                break;
            }
        }
    }

    if (!(currentGuessLngArray[0] == "-" || currentGuessLngArray[0] > 0 && currentGuessLngArray[0] <= 9)) {
        currentGuessLngArray.shift();           //remove first index if it isnt showing it being negative or a longer number
    }
    if (!(currentGuessLatArray[0] == "-" || currentGuessLatArray[0] > 0 && currentGuessLatArray[0] <= 9)) {
        currentGuessLatArray.shift();           //remove first index if it isnt showing it being negative or a longer number
    }

    for (let k = 0; k < 7; k++) {               //removes last 7 objects, could do with splice but I found this to be more understandable
        currentGuessLatArray.pop();     
        currentGuessLngArray.pop();     
    }

    //These two are the variables that reflect where the location actually is!

    currentGuessLAT = currentGuessLatArray.join('');        //saves lats and longs in seperate variables
    currentGuessLONG = currentGuessLngArray.join('');

    reloadIframe();                                         //now the map is generated, the iFrame is being reloaded.
}

var veryCloseDistances;
var closeDistances;
var farDistances;
var resMap;
var extraMsg;
var destinationMarker;

/* Map functions */

export function calculateDistances(mapsLat, mapsLong) {
    //calculates distance between set point and actual point.
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
    //compares how big the distance is and enables result screen with a message.

    var finalResult;
    var resultAsString;

    veryCloseDistances = ["Rainbolt?", "How?", "Impressive.", "Let me guess; you have an A in geography?", "Wow."]
    closeDistances = ["Wow, that was very close!", "You're good at this.", "Very close!", "Almost there!"];
    farDistances = ["It was a good guess.", "You'll get it next time!", "At least it was on the correct planet, right?"];

    if(distance < 20 && !(distance<1)) {
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

    enableResultScreen(resultAsString, extraMsg);
}

export function setMapToTargetPosition(key, playersLat, playersLong) {
    //this makes it so the map in the result screen is focused on the center between the point
    //and zooming out so both points are visible on the map.
    resMap = document.getElementById("resultMap");
    resMap = L.map('resultMap').setView([currentGuessLAT, currentGuessLONG], 15); //starting position

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    tileSize: 256,
    zoomOffset: -1,
    minZoom: 1,
    attribution: 'http://www.openstreetmap.org/copyright'
}).addTo(resMap);

var redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

    //this places the "correct" marker that actually reflects the target location
    destinationMarker = new L.Marker([currentGuessLAT, currentGuessLONG], {icon: redIcon});
    destinationMarker.addTo(resMap);
    
    console.log(destinationMarker.getLatLng());

    //used to create the line between the points

    var curLatLng = new L.LatLng(currentGuessLAT, currentGuessLONG);
    var playerLatLng = new L.LatLng(playersLat, playersLong);
    var polyList = [curLatLng, playerLatLng];
    var pointList = new L.LatLngBounds([curLatLng, playerLatLng]);
    var playerMarker;
    
    var polygon = L.polygon(polyList, {color: '#05060ab0', weight: '3',  dashArray: '10, 10', dashOffset: '-10'}).addTo(resMap);
    
   playerMarker = new L.Marker(playerLatLng, {icon: redIcon})
   playerMarker.addTo(resMap);

    resMap.fitBounds(pointList);
}

function enableResultScreen(resultString, extraMessage) {
    //enables the result screen.

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
    //reloads the iFrame and sets the position of the camera back to it's origin.

    document.getElementById("GuesserWindow").setAttribute("src", mapToLoad);
    window.setTimeout(() => { document.getElementById("BeforeOverlay").style.opacity = 0; document.getElementById("BeforeOverlay").style.visibility = "hidden"; }, 200);
}

function transitionToStart() {
    //fancy function to make a fade in to prevent the flashing of the iframe.

    document.getElementById("BeforeOverlay").style.opacity = 0;
    document.getElementById("BeforeOverlay").style.visibility = "visible";
    document.getElementById("BeforeOverlay").style.opacity = 100;
    window.setTimeout(() => {
        window.location.reload();
    }, 200);
}

function enableClickListeners(){
    //adding click listeners

    var resetBTN = document.getElementById("resetButtonSVG");
    resetBTN.addEventListener("click", reloadIframe);
    var logoBTN = document.getElementById("logo");
    logoBTN.addEventListener("click", generateNewLocation);
    var confirmBTN = document.getElementById("nextRound");
    confirmBTN.addEventListener("click", transitionToStart);
}

