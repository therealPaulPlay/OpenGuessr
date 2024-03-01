//Custom signup (WIP) -------------------------------------------------------------------------------------------------------------------

let isAuthenticated = true; //true if user is logged in 

//these are being accessed from index.html
let loginButton = document.getElementById("loginButton");
loginButton.addEventListener("click", goTologin);

let logoutButton = document.getElementById("logoutButton");
logoutButton.addEventListener("click", signout);

function signout() {
    //API call to log out user
}

function goTologin() {
    window.location.href = "/signup.html";
}

//Account UI (working) -------------------------------------------------------------------------------------------------------------

let profileButton = document.getElementById("profileButton");
profileButton.addEventListener("click", viewProfile);

let displayAccountName = document.getElementById("accountName");


let XPbarNoAccount = document.getElementById("XPbarNoAccount");
let XParea = document.getElementById("XParea");

let username = "Guest";

//default is not logged in, so these are all disabled
logoutButton.style.display = "none";
profileButton.style.display = "none";
XParea.style.display = "none";

async function changeUItoSignedIn () {
    logoutButton.style.display = "inline-block";
    loginButton.style.display = "none";
    profileButton.style.display = "inline-block";
    XPbarNoAccount.style.display = "none";
    XParea.style.display = "flex";
    enableExclusiveCategories();
    //TODO get Account information here to display user info
    displayUserInfo();
}

//part of checkSigninStatusAndLoadUserInfo
function displayUserInfo () {
    displayAccountName.innerHTML = username;
    profileName.innerHTML = username;
}

let profileInfo = document.getElementById("profileInfo");

checkSigninStatusAndLoadUserInfo(); //adjust the UI to the signin status and load user info on website load

async function checkSigninStatusAndLoadUserInfo () {
    if (isAuthenticated) {
        profileInfo.classList.remove("notSignedIn");
        changeUItoSignedIn();
    }
    else {
        profileInfo.classList.add("notSignedIn");
    }
}

function enableExclusiveCategories() {
    let accountLocked = document.getElementsByClassName("accountLock");
    let accountLockedArray = Array.from(accountLocked); // Convert to array
    for (let i = 0; i < accountLockedArray.length; i++) {
        accountLockedArray[i].classList.remove("accountLock");
    }

        document.getElementById("categoryExclusiveText").innerHTML = "You can now select these categories:";
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

export async function loadResultScreenXP(distance) {

    if (isAuthenticated) {
        //Checks whether or not the extra XP will cause the level to upgrade. Returns a value above 1 if yes. 
        let XPbarResource = document.getElementById("endScreenXPbarResource");

        let currentXP = 15000; //TODO fetch user XP here! currentXP should be set to the user's XP
        
        let earnedXP = Math.round(5000 * ((0.998036) ** distance));

        XPbarResource.classList.remove("XPbarAnimate");

        if ((willCauseLevelUpgrade(currentXP, earnedXP)) > 1) {
            XPbarResource.style.width = 0; //reset bar to beginning if it will go up by a level
        }
        else {
            XPbarResource.style.width = uiSetUserXP(currentXP) * 100 + "%";
        }


        setUserXP(currentXP + earnedXP); //save XP, this is the last step!
        setTimeout(function () {
            XPbarResource.classList.add("XPbarAnimate");
            XPbarResource.style.width = uiSetUserXP(currentXP + earnedXP) * 100 + "%";
            resultLevelText.innerHTML = "+" + earnedXP + " XP / " + resultLevelText.innerHTML;
        }, 10);
    }
}

//TODO the actual XP number has to be retrieved from the user (and set by the backend)
uiSetUserXP(15000);

function setUserXP(xp) {
    //TODO make API call to save XP to the users account's custom data (with backend)
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
    profileName.innerHTML =  username;

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
        document.getElementById("usernameInput").value = ""; 
    }
}

let newUsername;

function updateUsername () {
    newUsername = document.getElementById("usernameInput").value;
    console.log("username change requested. New name: " + newUsername);
    toggleUsernameView();
    if (newUsername != "") {
        //TODO change username via API / Backend + fetch new username + then run displayUserInfo() to update in UI
    }
}

//The code below was an attempt to make setting user data work in the frontend

/*
let newUsername = "";
let playerXP = 0.0;
let bearerToken;


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
*/
