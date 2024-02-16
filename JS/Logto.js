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