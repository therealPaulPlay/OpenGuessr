//IMPORTANT: ANY changes here affect nothing if you don't run "npm run build" - this file is never being loaded in except in the bundled.js, so you need to do that. 
import LogtoClient from '@logto/browser';

let loginSwitchBack = document.getElementById("loginButton");
loginSwitchBack.addEventListener("click", login);

const logtoClient = new LogtoClient({
    endpoint: 'https://jh8qv6.logto.app/',
    appId: 'qjoomd9umtfhwk33mkyev',
});

function login() {
    console.log('test');
    logtoClient.signIn('https://jh8qv6.logto.app/callback').then(result => {
        console.log(result);
    })
}

console.log(logtoClient);

//login(); - currently redirects to the login page but displays an error 