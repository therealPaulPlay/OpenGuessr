import "main.js";

/* Streetview */

const response = await fetch('../JSON/locList.json');
var jsonResponse = await response.json();

const listOfLocations = Object.values(jsonResponse).flat().map(i => Object.values(i)).flat();

console.log(listOfLocations);

var lastGuessIndex = null;
var guessIndex;
var mapToLoad;
var currentGuessLAT = 0;
var currentGuessLONG = 0;

generateNewLocation();

function generateNewLocation() {

    do {
        guessIndex = Math.floor(Math.random()*listOfLocations.length);
    } while (lastGuessIndex == guessIndex);

    console.log(guessIndex);

    lastGuessIndex = guessIndex;

    mapToLoad = listOfLocations[guessIndex];
    //currentGuessLAT = listOfLocations[guessIndex+1];             //save target latitude in var (from array)
    //currentGuessLONG = listOfLocations[guessIndex+2];            //save target longitude in var (from array)
    reloadIframe();
}