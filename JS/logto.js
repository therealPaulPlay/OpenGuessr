//IMPORTANT: ANY changes here affect nothing if you don't run "npm run build" - this file is never being loaded in except in the bundled.js, so you need to do that. 
import LogtoClient from '@logto/browser';

let loginSwitchBack = document.getElementById("loginButton");
loginSwitchBack.addEventListener("click", login);

const logtoClient = new LogtoClient({

    endpoint: 'https://jh8qv6.logto.app/',
    appId: '3d46yzci0ettygtpr5vbw',
  });

//localhost:3000 callback url is only for testing. We need to properly configure a callback site
function login() {
    logtoClient.signIn("http://localhost:3000/callback").then(result => {
        console.log(result);
    })
}

function signout() {
    logtoClient.signOut("http://localhost:3000");
}

//this code should be placed in the /callback route - i have no idea what that is
try {
    await logtoClient.handleSignInCallback(window.location.href);
    console.log(await logtoClient.isAuthenticated()); // true
  } catch {
    // Handle error
  }