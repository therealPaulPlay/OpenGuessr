import { errorPopup } from "./errorHandling.js";
import { coordsFromHost } from "./multiplayer.js";
import { mapCategory } from "./categoryMenu.js";
import { competition, currentRound } from "./competitionLogic.js";

//This is THE function to GET LOCATIONS (all others here are NOT export
export async function getLocationCoordinates(type) {

    //show loading screen
    document.getElementById("BeforeOverlay").style.opacity = "100";
    document.getElementById("BeforeOverlay").style.visibility = "visible";

    if (type == "JSON") {
        return await getCoordsFromJSON(mapCategory);
    } else if (type == "SDK") {
        return await getCoordsFromLocationServer();
    } else if (type == "FROMHOST") {
        return coordsFromHost; 
    } else if (type == "COMMUNITY") {
        return await getCommunityMapCoordinates();
    } else if (type == "COMPETITION") {
        return await getCompetitionCoordinates();
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
            let response = null;

            response = await fetch("./JSON/" + jsonName + "Locations.json");

            if (!response.ok) {
                throw new Error("JSON fetch failed.");
            }

            jsonResponse = await response.json();
            currentlyLoadedJson = jsonName; //set currently loaded json to the new one
            lastGuessesIndexes = []; //reset previously played indexes
            listOfLocations = jsonResponse.locations;

        } catch (error) {
            //choose standard and instantly reload (if categories get renamed / get deleted-> this happens)
            localStorage.setItem("selectedCategory", "standard");
            window.location.reload();
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
        if (listOfLocations.length < 110) {
            lastGuessesIndexes = [];
            console.warn("Loaded official map json has too few locations!");
        }

        do {
            guessIndex = Math.floor(Math.random() * listOfLocations.length);
        } while (lastGuessesIndexes.includes(guessIndex));

        lastGuessesIndexes.unshift(guessIndex); //add guessIndex at the front of the array

        if (lastGuessesIndexes.length > 100) {
            lastGuessesIndexes.pop(); //if the array is longer than 100, pop the last entry out
        }

        const resultLat = Number(listOfLocations[guessIndex][0]);
        const resultLong = Number(listOfLocations[guessIndex][1]);
        const additionalProperty = listOfLocations[guessIndex][2]; // only available for certain modes (like country guesser, image guesser..). This could be the country, the image URL etc.

        resultLocationsArray = [resultLat, resultLong, additionalProperty];
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
                return await loadBackupLocations(response.status);
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
          if (standardLocations.length < 110) {
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
  
          const resultLat = Number(standardLocations[guessIndex][0]);
          const resultLong = Number(standardLocations[guessIndex][1]);
  
          resultLocationsArray = [resultLat, resultLong];
      } catch (error) {
          console.error("Error in locationGeneration.js Standard Location JSON generation: " + error);
      }
  
      return resultLocationsArray;
}

//in case the location server does not respond, load the backup, formerly daily locations (just totally random locations) instead
async function loadBackupLocations(error) {
    console.log("Loading backup locations.");
    errorPopup("Location server error", "Loading local backup locations instead. ", "Error: " + error);
    return await getCoordsFromJSON("backup");
}

//Get community map coordinates ---------------------------------------------------------------------------

let communityLocations = null;

async function getCommunityMapCoordinates() {
    //Json files could later be fetched from a server here
    try {
        const response = await fetch("https://maps.openguessr.com/maps/" + mapCategory.replace("community_", ""), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
    
        // Check if the response is successful
        if (response.ok) {
          const data = await response.json();
          communityLocations = data.map_data.locations; //the array is in locations: {}
          return await selectLocationFromMapsServer(); //pick one new location for playing
    
        } else {
            console.error("Community map fetch failed. Server returned error:", response.status);
            if (response.status == 404) {
                errorPopup("Community map was deleted", "This map was likely deleted and cannot be found.", response.status, true);
            } else {
                errorPopup("Error loading community map", "An error occured on the maps server.", response.status, true);
            }
            return null;
        }
      } catch (error) {
        console.error("Error occurred while fetching map from server: ", error);
        errorPopup("Error loading community map", "The maps server can't be reached.", error, true);
        return null;
      }
}

let lastCommunityLocationIndexes = [];

async function selectLocationFromMapsServer() {
    //now, pick a random location
    let resultLocationsArray = [];

    try {

        //to prevent a crashes if the json has too few locations
        if (communityLocations.length < 35) {
            lastCommunityLocationIndexes = [];
            console.warn("Loaded community map json has too few locations!");
        }

        do {
            guessIndex = Math.floor(Math.random() * communityLocations.length);
        } while (lastCommunityLocationIndexes.includes(guessIndex));

        lastCommunityLocationIndexes.unshift(guessIndex); //add guessIndex at the front of the array

        if (lastCommunityLocationIndexes.length > 30) {
            lastCommunityLocationIndexes.pop(); //if the array is longer than 30, pop the last entry out
        }

        const resultLat = Number(communityLocations[guessIndex][0]);
        const resultLong = Number(communityLocations[guessIndex][1]);

        resultLocationsArray = [resultLat, resultLong];
    } catch (error) {
        console.error("Error in locationGeneration.js Community map location JSON generation: " + error);
    }

    return resultLocationsArray;
}

// get Competition coordinates ---------------------------------------------------------------------------------------------

async function getCompetitionCoordinates() {
    let resultLocationsArray = [];

    try {
        const resultLat = competition.locations[currentRound][0];
        const resultLong = competition.locations[currentRound][1];
    
        resultLocationsArray = [resultLat, resultLong];
    } catch (error) {
        console.error("Error in locationGeneration.js in getCompetitionCoordinates: " + error);
    }

    return resultLocationsArray;
}