//IMPORTANT: ANY changes here affect nothing if you don't run "npm run build" - this file is never being loaded in except in the bundled.js, so you need to do that. 
import LogtoClient from '@logto/browser';

//this URL is being used for the site and callback (with /callback attached). It should only be localhost for testing
let logtoURL = "http://localhost:3000";

let loginButton = document.getElementById("loginButton");
loginButton.addEventListener("click", login);

let logoutButton = document.getElementById("logoutButton");
logoutButton.addEventListener("click", signout);



const logtoClient = new LogtoClient({

    endpoint: 'https://jh8qv6.logto.app/',
    appId: '3d46yzci0ettygtpr5vbw',
  });

function login() {
    logtoClient.signIn(logtoURL+"/callback").then(result => {
        console.log(result);
    })
}

function signout() {
    logtoClient.signOut(logtoURL);
}

export async function callbackHandling () {
    try {
        await logtoClient.handleSignInCallback(window.location.href);
        console.log(await logtoClient.isAuthenticated()); // true - need to route back to the homepage here somehow
    } catch {
        // Handle error
    }
}