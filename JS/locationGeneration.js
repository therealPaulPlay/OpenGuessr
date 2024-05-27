import { errorPopup } from "./errorHandling.js";
import { coordsFromHost } from "./multiplayer.js";
import { mapCategory } from "./categoryMenu.js";
import { getDailyChallengeIndex } from "./userAPI.js";

//This is THE function to GET LOCATIONS (all others here are NOT export
export async function getLocationCoordinates(type) {

    //show loading screen
    document.getElementById("BeforeOverlay").style.opacity = "100";
    document.getElementById("BeforeOverlay").style.visibility = "visible";

    if (type == "JSON") {
        return await getCoordsFromJSON(mapCategory);
    } else if (type == "SDK" && type != "DAILY") {
        return await getCoordsFromLocationServer();
    } else if (type == "DAILY") {
        return await getCoordsFromServerDaily();
    } else if (type == "FROMHOST") {
        return coordsFromHost;
    } else {
        console.error("Incorrect Location type set in locationGeneration.js");
    }
}


//Get Location from JSON (Legacy/Custom Map creation method) ----------------------------------------------------------------------------------------------------
let listOfLocations = [];
let jsonResponse;
let lastGuessesIndexes = []; //to prevent repetition
let currentlyLoadedJson;

let guessIndex;


//Load location JSON files
async function loadLocationJSON(jsonName) {
    if (currentlyLoadedJson != jsonName) {
        try {
            let response = await fetch("./JSON/" + jsonName + "Locations.json");

            if (!response.ok) {
                throw new Error("JSON fetch failed.");
            }

            jsonResponse = await response.json();
            currentlyLoadedJson = jsonName; //set currently loaded json to the new one
            lastGuessesIndexes = []; //reset previously played indexes
            listOfLocations = jsonResponse;

        } catch (error) {
            errorPopup("JSON error", "There was an error loading the location json file.", "JSON Fetch failed.", true);
            console.error(error);
        }
    }
}

//This will be called in main.js when a new location is being generated
async function getCoordsFromJSON(category) {

    let resultLocationsArray;

    if (currentlyLoadedJson != category) {
        try {
            await loadLocationJSON(category);
        } catch (error) {
            console.error("Error loading location json in getCoordsFromJson in locationGeneration.js: " + error);
        }
    }

    try {

        //to prevent a crashes if the json has too few locations
        if (listOfLocations.length < 15) {
            lastGuessesIndexes = [];
            console.warn("Loaded json has too few locations!");
        }

        do {
            guessIndex = Math.floor(Math.random() * listOfLocations.length);
        } while (lastGuessesIndexes.includes(guessIndex));

        lastGuessesIndexes.unshift(guessIndex); //add guessIndex at the front of the array

        if (lastGuessesIndexes.length > 10) {
            lastGuessesIndexes.pop(); //if the array is longer than 10, pop the last entry out
        }

        const resultLat = listOfLocations[guessIndex][0];
        const resultLong = listOfLocations[guessIndex][1];
        const country = listOfLocations[guessIndex][2]; //only available for certain modes (like country guesser)

        resultLocationsArray = [resultLat, resultLong, country];
    } catch (error) {
        console.error("Error in locationGeneration.js during JSON Gen: " + error);
    }

    return resultLocationsArray;
}


//Get Locations from google maps js API node.js SERVER (new method - unlimited locations) -------------------------------------------------------------------------------

let standardLocations = null;
let lastStandardLocationIndexes = [];

async function getCoordsFromLocationServer() {
    //if the standard locations aren't already loaded
    if (!standardLocations) {
        console.log("loading locations")
        try {
            let locationEndpoint = "https://locations.openguessr.com/locations"; //for testing, use http://localhost:3000/locations
        
            const response = await fetch(locationEndpoint, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
        
            // Check if the response is successful
            if (response.ok) {
              const data = await response.json();
              standardLocations = data.locations; //the array is in locations: {}
              return await selectLocationFromServer(); //pick one new location for playing
        
            } else {
                console.error("Location fetch failed. Server returned error:", response.status);
                return await loadBackupLocations(error);
            }
          } catch (error) {
            console.error("Error occurred while fetching locations from server: ", error);
            return await loadBackupLocations(error);
          }
    } else {
        return await selectLocationFromServer(); //just select a location from the server's json file, as it is already loaded
    }
}

async function selectLocationFromServer() {
      //now, pick a random location
      let resultLocationsArray = [];

      try {
  
          //to prevent a crashes if the json has too few locations
          if (standardLocations.length < 105) {
              lastStandardLocationIndexes = [];
              console.warn("Loaded standard json has too few locations!");
          }
  
          do {
              guessIndex = Math.floor(Math.random() * standardLocations.length);
          } while (lastStandardLocationIndexes.includes(guessIndex));
  
          lastStandardLocationIndexes.unshift(guessIndex); //add guessIndex at the front of the array
  
          if (lastStandardLocationIndexes.length > 100) {
              lastStandardLocationIndexes.pop(); //if the array is longer than 100, pop the last entry out
          }
  
          const resultLat = standardLocations[guessIndex][0];
          const resultLong = standardLocations[guessIndex][1];
          const country = standardLocations[guessIndex][2]; //only available for certain modes (like country guesser)
  
          resultLocationsArray = [resultLat, resultLong, country];
      } catch (error) {
          console.error("Error in locationGeneration.js Standard Location JSON generation: " + error);
      }
  
      return resultLocationsArray;
}

//in case the location server does not respond, load the daily locations (just totally random locations) instead
async function loadBackupLocations(error) {
    console.log("Loading backup locations.");
    errorPopup("Location server error", "Loading local backup locations instead. ", "Error: " + error);
    return await getCoordsFromJSON("daily");
}

//Get coords from Server for Daily Challenge -----------------------------------------------------------------------------------------------------------------------

async function getCoordsFromServerDaily() {
    //Load location JSON files
    try {
        let response = await fetch("./JSON/dailyLocations.json");

        jsonResponse = await response.json();
        listOfLocations = jsonResponse;

    } catch (error) {
        errorPopup("JSON error", "There was an error loading the location json file.", "JSON Fetch failed.", true);
        console.error(error);
    }

    try {
        let dailyChallengeCoordinatesIndex = await getDailyChallengeIndex(listOfLocations.length);

        const resultLat = listOfLocations[dailyChallengeCoordinatesIndex][0];
        const resultLong = listOfLocations[dailyChallengeCoordinatesIndex][1];

        let resultLocationsArray = [resultLat, resultLong];

        return resultLocationsArray;
    } catch {
        errorPopup("Challenge API Error", "There was an error fetching the daily challenge location", "Challenge Fetch failed.", true);
        return null;
    }
}