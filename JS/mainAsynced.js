import "/JS/main.js";

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

getLocationVarsAndPass(guessIndex, lastGuessIndex, mapToLoad, listOfLocations);