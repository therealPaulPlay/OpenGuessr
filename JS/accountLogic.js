import { updateUsername as updateUsername, getUser, updateExperience } from "./userAPI";

let profileName = document.getElementById("profileViewName");

let profileInfo = document.getElementById("profileInfo");

let loginButton = document.getElementById("loginButton");
loginButton.addEventListener("click", goTologin);

let logoutButton = document.getElementById("logoutButton");
logoutButton.addEventListener("click", signout);

let profileButton = document.getElementById("profileButton");
profileButton.addEventListener("click", viewProfile);

let displayAccountName = document.getElementById("accountName");

let XPbarNoAccount = document.getElementById("XPbarNoAccount");
let XParea = document.getElementById("XParea");

let profileClose = document.getElementById("profileClose");
profileClose.addEventListener("click", closeProfile);

let profileWindow = document.getElementById("profileWindow");

//default is not logged in, so these are all disabled
logoutButton.style.display = "none";
profileButton.style.display = "none";
XParea.style.display = "none";

document.getElementById("usernameInput").style.visibility = "hidden";
document.getElementById("confirmUsername").style.visibility = "hidden";

document.getElementById("editUsername").addEventListener("click", toggleUsernameView);
document.getElementById("confirmUsername").addEventListener("click", updateProfileUsername);

let resultLevelText = document.getElementById("endScreenLevel");

//Custom signup (WIP) -------------------------------------------------------------------------------------------------------------------

let isAuthenticated = false; //true if user is logged in 

checkAuthenticationStatus();

function checkAuthenticationStatus() {
  let bearerToken = localStorage.getItem("bearer");

  if (bearerToken != null && bearerToken != "") {
    if (isTokenExpired(bearerToken)) {
      isAuthenticated = false;
    }
    else {
      isAuthenticated = true;
    }
  }
  else {
    isAuthenticated = false;
  }
  checkSigninStatusAndLoadUserInfo(); //set UI accordingly
}


/* this should decode the token and return expired (true/false) - only works if the token is not encrypted,
otherwise we will need a jwt token verifier (with public key) */
function isTokenExpired(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  try {
    const { exp } = JSON.parse(jsonPayload);
    const expired = Date.now() >= exp * 1000;
    return expired;
  }

  catch {
    expired = false;
    return expired;
  }

}

//these are being accessed from index.htm

function signout() {
  localStorage.removeItem("bearer"); //reset bearer token
  localStorage.removeItem("id");
  localStorage.removeItem("username");
  localStorage.removeItem("experience");
  window.location.reload(); //reload website, so that UI etc. will be reset and all the loaded values aren't still showing
}

function goTologin() {
  window.location.href = "/signup.html";
}

//Account UI (working) -------------------------------------------------------------------------------------------------------------

XPbarNoAccount.addEventListener("click", function() {
  window.location.href = "/signup.html";
})

//part of checkSigninStatusAndLoadUserInfo
async function changeUItoSignedIn() {
  logoutButton.style.display = "inline-block";
  loginButton.style.display = "none";
  profileButton.style.display = "inline-block";
  XPbarNoAccount.style.display = "none";
  XParea.style.display = "flex";
  enableExclusiveCategories();
  displayUserInfo();
}

let username;

//part of checkSigninStatusAndLoadUserInfo
function displayUserInfo() {
  uiSetUserXP(localStorage.getItem("experience"));
  username = localStorage.getItem("username");
  displayAccountName.innerHTML = username;
  profileName.innerHTML = username;
}

//adjust the UI to the signin status and load user info on website load
async function checkSigninStatusAndLoadUserInfo() {
  if (isAuthenticated) {
    profileInfo.classList.remove("notSignedIn");
    //load user data - experience, username etc. could have been changed on a different device -> make sure to load them in!
    await getUser(localStorage.getItem("bearer"), localStorage.getItem("id"), "index").then(() => {
          displayUserInfo();
        });
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

  return {fraction: (xp / requiredXP), requiredForLevelUpgrade: requiredXP - xp};
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

    let currentXP = Number(localStorage.getItem("experience"));

    let selectedCategory = localStorage.getItem("selectedCategory");

    let earnedXP;

    if (selectedCategory == null || selectedCategory == "standard" || selectedCategory == "famous" || selectedCategory == "capital") {
        earnedXP = Math.round(5000 * ((0.998036) ** distance)); 
    } else {
      earnedXP = Math.round(5000 * ((0.988036) ** distance)) //reduced XP for bad guesses in country locations (for better balance)
    }

      XPbarResource.classList.remove("XPbarAnimate");

    if ((willCauseLevelUpgrade(currentXP, earnedXP)) > 1) {
      XPbarResource.style.width = 0; //reset bar to beginning if it will go up by a level
    }
    else {
      XPbarResource.style.width = uiSetUserXP(currentXP).fraction * 100 + "%";
    }


    setUserXP(currentXP + earnedXP); //save XP, this is the last step!
    setTimeout(function() {
      XPbarResource.classList.add("XPbarAnimate");
      XPbarResource.style.width = uiSetUserXP(currentXP + earnedXP).fraction * 100 + "%";
      resultLevelText.innerHTML = "+" + earnedXP + " XP / " + resultLevelText.innerHTML;
    }, 10);
  }
}

function setUserXP(xp) {
  updateExperience(localStorage.getItem("bearer"), localStorage.getItem("id"), xp, "index");
}


//Profile Window ---------------------------------------------------------------------------------------------

function viewProfile() {
  username = localStorage.getItem("username");
  profileWindow.style.display = "block";
  document.getElementById("blackBackground").style.visibility = "visible";
  profileName.innerHTML = username;
  document.getElementById("statisticExperience").innerHTML = "Total experience: " + Number(localStorage.getItem("experience")).toLocaleString();
  document.getElementById("statisticUpgradeExperience").innerHTML = "Required for next level: " + uiSetUserXP(Number(localStorage.getItem("experience"))).requiredForLevelUpgrade.toLocaleString();

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

async function updateProfileUsername() {
  newUsername = document.getElementById("usernameInput").value;
  toggleUsernameView();
  if (newUsername != "") {
  await updateUsername(localStorage.getItem("bearer"), localStorage.getItem("id"), newUsername, "index").then(() => {
    //updateUsername saves the new name in localstorage
        displayUserInfo();
      });
  }
}

