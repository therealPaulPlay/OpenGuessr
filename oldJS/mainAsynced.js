import "/JS/main.js";

/* Streetview */

function fetchJSON() {
    const response = await fetch('../JSON/locList.json');
    var jsonResponse = await response.json();
}

var locList = Object.values(jsonResponse).flat().map(i => Object.values(i)).flat();