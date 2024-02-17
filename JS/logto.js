//IMPORTANT: ANY changes here affect nothing if you don't run "npm run build" - this file is never being loaded in except in the bundled.js, so you need to do that. 
import LogtoClient from '@logto/browser';

//this URL is being used for the site and callback (with /callback attached). It should only be localhost for testing
let logtoURL = "http://localhost:3000";

let loginButton = document.getElementById("loginButton");
loginButton.addEventListener("click", login);

let logoutButton = document.getElementById("logoutButton");
logoutButton.addEventListener("click", signout);

let displayAccountName = document.getElementById("accountName");

//default doesn't show the signout button
logoutButton.style.display = "none";


const logtoClient = new LogtoClient({

    endpoint: 'https://jh8qv6.logto.app/',
    appId: '3d46yzci0ettygtpr5vbw',
  });


// we don't specify the callback url here because we aren't using routing
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
        if (await logtoClient.isAuthenticated()) {
            changeUItoSignedIn();
            console.log("signed in!");
        }
      } catch {
        // Handle error (we do nothing if there is an error because this code is flawless)
      }
}

handleCallback();

async function changeUItoSignedIn () {
    logoutButton.style.display = "block";
    loginButton.style.display = "none";
    //displayAccountName.innerHTML = get the name
    logtoClient.fetchUserInfo().then((res) => console.log(res)); //this logs the json object, we need to somehow get the email address from this or sth like that cuz with the email login we don't get a username (maybe we can require a username on the login page?)
}