//IMPORTANT: ANY changes here affect nothing if you don't run "npm run build" - this file is never being loaded in except in the bundled.js, so you need to do that. 
import LogtoClient from "@logto/browser";
import { errorPopup } from "./errorHandling.js";

//TODO Localhost URL for testing ONLY!! Production will be our domain (already configured in admin console, only need to change it here)
let logtoURL = "http://localhost:3000";
const logtoEndpoint = 'https://jh8qv6.logto.app/'

const logtoClient = new LogtoClient({
    endpoint: logtoEndpoint,
    appId: '3d46yzci0ettygtpr5vbw',
  });

function login() {
    logtoClient.signIn(logtoURL);
}

function signout() {
    logtoClient.signOut(logtoURL);
}

let bearerToken;

//works without routing, we just use the main page as the callback page and handle it here. Probably not the most secure, however, we still have a unique uri that is being attached by logto (so idk)
async function handleCallback () {
    try {
        await logtoClient.handleSignInCallback(window.location.href);
        if (await logtoClient.isAuthenticated()) { //wait until the signin was successful
            checkSigninStatusAndLoadUserInfo();
            console.log("signed in!");
        }
      } catch {

      }
}

handleCallback();

//Account UI -------------------------------------------------------------------------------------------------------------

let loginButton = document.getElementById("loginButton");
loginButton.addEventListener("click", login);

let logoutButton = document.getElementById("logoutButton");
logoutButton.addEventListener("click", signout);

let profileButton = document.getElementById("profileButton");
profileButton.addEventListener("click", viewProfile);

let displayAccountName = document.getElementById("accountName");

let userInfoJson;

logoutButton.style.display = "none"; //logout and profile button are hidden by default (default = not logged in)
profileButton.style.display = "none";

//part of checkSigninStatusAndLoadUserInfo
async function changeUItoSignedIn () {
    logoutButton.style.display = "inline-block";
    loginButton.style.display = "none";
    profileButton.style.display = "inline-block";
    enableExclusiveCategories();
    logtoClient.fetchUserInfo().then((res) => {userInfoJson = res; displayUserInfo()}); //this saves the json object here
}

//part of checkSigninStatusAndLoadUserInfo
function displayUserInfo () {
    displayAccountName.innerHTML = userInfoJson["username"] == null ? userInfoJson["sub"] : userInfoJson["username"]; //sub is the unique user identifier
    profileName.innerHTML =  userInfoJson["username"] == null ? userInfoJson["sub"] : userInfoJson["username"];
}

let profileInfo = document.getElementById("profileInfo");

checkSigninStatusAndLoadUserInfo(); //adjust the UI to the signin status and load user info on website load

async function checkSigninStatusAndLoadUserInfo () {
    if (await logtoClient.isAuthenticated()) {
        profileInfo.classList.remove("notSignedIn");
        changeUItoSignedIn();
    }
    else {
        profileInfo.classList.add("notSignedIn");
    }
}

function enableExclusiveCategories() {
    let accountLocked = document.getElementsByClassName("accountLock");
    for (let i = 0; i < accountLocked.length; i++) {
        accountLocked[i].classList.remove("accountLock");
    }
    document.getElementById("categoryExclusiveText").innerHTML = "You can now choose these categories:";
}

//XP bar loading function -------------------------------------------------------------------------------------------------

let resultLevelText = document.getElementById("endScreenLevel");
let requiredXP;

function uiSetUserXP(xp) {
    const baseXP = 5000;
    const xpIncreaseRate = 1.1; // xp needed to level up increases per level
    
    // Calculate the level based on an exponential growth of required XP
    let templevel = 1;
    requiredXP = baseXP;
    
    while (xp >= requiredXP) {
        xp -= requiredXP;
        templevel++;
        requiredXP = Math.floor(baseXP * Math.pow(xpIncreaseRate, templevel - 1));
    }
    
    let levelXPbar = document.getElementById("progressBar");
    let levelText = document.getElementById("levelText");
    
    // Update the UI with the calculated level and XP progress
    levelText.innerHTML = "Level " + templevel;
    resultLevelText.innerHTML = "Level " + templevel;
    levelXPbar.style.width = (xp / requiredXP) * 100 + "%"; 

    return (xp / requiredXP);
}

function willCauseLevelUpgrade(xp, newXP) {
    const baseXP = 5000;
    const xpIncreaseRate = 1.1;
    
    let templevel = 1;
    requiredXP = baseXP;
    
    while (xp >= requiredXP) {
        xp -= requiredXP;
        templevel++;
        requiredXP = Math.floor(baseXP * Math.pow(xpIncreaseRate, templevel - 1));
    }
    
    return ((xp + newXP) / requiredXP);
}

export function loadResultScreenXP(distance) { //Checks whether or not the extra XP will cause the level to upgrade. Returns a value above 1 if yes. 
    let XPbarResource = document.getElementById("endScreenXPbarResource");
   
    let currentXP = 15000; //TODO fetch user XP here
    let earnedXP = Math.round(5000 * ((0.998036) ** distance));

    XPbarResource.classList.remove("XPbarAnimate");
    
    if ((willCauseLevelUpgrade(currentXP, earnedXP)) > 1) { 
        XPbarResource.style.width = 0; //reset bar to beginning if it will go up by a level
    }
    else {
        XPbarResource.style.width = uiSetUserXP(currentXP) * 100 + "%";
    }


    setUserXP(currentXP + earnedXP); //save XP, this is the last step!
    setTimeout(function() {
        XPbarResource.classList.add("XPbarAnimate");
        XPbarResource.style.width = uiSetUserXP(currentXP + earnedXP) * 100 + "%";
        resultLevelText.innerHTML = "+" + earnedXP + " XP / " + resultLevelText.innerHTML;
    }, 10);
}

//TODO this is just for testing, the actual XP number has to be retrieved from the json file and set by the backend.
uiSetUserXP(15000);

function setUserXP(xp) {
    //TODO make API call to save XP to the users account's custom data
    console.log(xp);
}


//Profile Window ---------------------------------------------------------------------------------------------

let profileClose = document.getElementById("profileClose");
profileClose.addEventListener("click", closeProfile);

let profileWindow = document.getElementById("profileWindow");

let profileName = document.getElementById("profileViewName");

document.getElementById("usernameInput").style.visibility = "hidden";
document.getElementById("confirmUsername").style.visibility = "hidden";

document.getElementById("editUsername").addEventListener("click", toggleUsernameView);
document.getElementById("confirmUsername").addEventListener("click", updateUsername);

function viewProfile () {
    profileWindow.style.display = "block";
    document.getElementById("blackBackground").style.visibility = "visible";
    profileName.innerHTML =  userInfoJson["username"] == null ? userInfoJson["sub"] : userInfoJson["username"];

}

function closeProfile() {
    profileWindow.style.display = "none";
    document.getElementById("blackBackground").style.visibility = "hidden";
}

function toggleUsernameView() {
    if (document.getElementById("usernameInput").style.visibility == "hidden") {
        document.getElementById("usernameInput").style.visibility = "visible";
        document.getElementById("confirmUsername").style.visibility = "visible";
    }
    else {
        document.getElementById("usernameInput").style.visibility = "hidden";
        document.getElementById("confirmUsername").style.visibility = "hidden";
        document.getElementById("usernameInput").value = ""; //reset the username input box
    }
}

let newUsername = "";
let playerXP = 0.0;


function updateUsername() {
  let requestUrl = `${logtoEndpoint}api/users/${userInfoJson["sub"]}`;
  newUsername = document.getElementById("usernameInput").value;
  toggleUsernameView();

  bearerToken = logtoClient.getAccessToken();

  if (newUsername != null) {
    const options = {
          method: 'PATCH',
          crossDomain: true,
          mode: 'cors',
          headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              "username": newUsername,
              "customData": {
                 "xp": playerXP
              }
          })
    }

    fetch(requestUrl, options)
      .then(response => {
        console.log(response);
        if (!response.ok) {
          errorPopup(
            "Username change failed", 
            "The username could not be changed due to an unknown error",
            "401");
        } else {
          console.log(response);
          return response.json();
        }
    })
    .catch(error => {
      console.log(error);
      errorPopup(
        "Username change failed", 
        "The username could not be changed due to an unknown error",
        error);
    })
  }
}
