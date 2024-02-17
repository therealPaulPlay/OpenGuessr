//IMPORTANT: ANY changes here affect nothing if you don't run "npm run build" - this file is never being loaded in except in the bundled.js, so you need to do that. 
import LogtoClient from '@logto/browser';

//Localhost URL for testing ONLY!! Production will be our domain (already configured in admin console, only need to change it here)
let logtoURL = "http://localhost:3000";

const logtoClient = new LogtoClient({

    endpoint: 'https://jh8qv6.logto.app/',
    appId: '3d46yzci0ettygtpr5vbw',
  });


function login() {
    logtoClient.signIn(logtoURL).then(result => {
        console.log(result);
    })
}

function signout() {
    logtoClient.signOut(logtoURL);
}


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




//Profile UI -------------------------------------------------------------------------------------------------------------

let loginButton = document.getElementById("loginButton");
loginButton.addEventListener("click", login);

let logoutButton = document.getElementById("logoutButton");
logoutButton.addEventListener("click", signout);

let displayAccountName = document.getElementById("accountName");

let userInfoJson;

logoutButton.style.display = "none"; //logout button is hidden by default

//part of checkSigninStatusAndLoadUserInfo
async function changeUItoSignedIn () {
    logoutButton.style.display = "block";
    loginButton.style.display = "none";
    logtoClient.fetchUserInfo().then((res) => {userInfoJson = res; displayUserInfo()}); //this saves the json object here
}

//part of checkSigninStatusAndLoadUserInfo
function displayUserInfo () {
    console.log(userInfoJson);
    displayAccountName.innerHTML = userInfoJson["sub"]; //sub is the unique user identifier
    if (userInfoJson["username"] != null) {
        displayAccountName.innerHTML = userInfoJson["username"];
    }
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






//XP bar loading function -------------------------------------------------------------------------------------------------

let levelXPbar = document.getElementById("progressBar");
let levelText = document.getElementById("levelText");

function setUserXP(xp) {
    const baseXP = 5000;
    const xpIncreaseRate = 1.1; // xp needed to level up increases per level
    
    // Calculate the level based on an exponential growth of required XP
    let templevel = 1;
    let requiredXP = baseXP;
    
    while (xp >= requiredXP) {
        xp -= requiredXP;
        templevel++;
        requiredXP = Math.floor(baseXP * Math.pow(xpIncreaseRate, templevel - 1));
    }
    
    // Update the UI with the calculated level and XP progress
    levelText.innerHTML = "Level " + templevel;
    levelXPbar.style.width = (xp / requiredXP) * 100 + "%"; 
}

//this is just for testing, the actual XP number has to be retrieved from the json file and set by the backend.
setUserXP(55000);