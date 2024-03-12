const imported = document.createElement('script');
imported.src = "https://www.googletagmanager.com/gtag/js?id=G-DXD64B7ZDX";
document.head.appendChild(imported);

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

if (localStorage.getItem("consentMode") === null) {
    //default - everything is denied, no data will be collected
        gtag("consent", "default", {
            "ad-storage": "denied",
            "analytics_storage": "denied",
            "personalization_storage": "denied",
            "functionality_storage": "denied",
            "security_storage": "denied",
        })
        //show cookie banner
        document.getElementById("cookieBanner").style.visibility = "visible";
    }
    else {
        gtag("consent","default", JSON.parse(localStorage.getItem("consentMode")));
        
        hideCookieBanner();
    }

//enable the config - this will now show accurate usage numbers like the current player amount or the average time spent in the game
gtag('js', new Date());

gtag('config', 'G-DXD64B7ZDX', {
	cookie_domain: location.hostname,
	cookie_flags: "SameSite=None; Secure",
});


//my diy cookie banner 
let cookiesAccept = document.getElementById("cookiesAccept");
cookiesAccept.addEventListener("click", allowAnalytics);

let cookiesDeny = document.getElementById("cookiesDeny");
cookiesDeny.addEventListener("click", denyAnalytics);

function allowAnalytics() {
    const consentMode = {
            "ad-storage": "granted",
            "analytics_storage": "granted",
            "personalization_storage": "granted",
            "functionality_storage": "granted",
            "security_storage": "granted",
    }
    gtag("consent","update", consentMode);
    localStorage.setItem("consentMode", JSON.stringify(consentMode));

     //hide cookie banner
     hideCookieBanner();
}

function denyAnalytics() {
    const consentMode = {
            "ad-storage": "denied",
            "analytics_storage": "denied",
            "personalization_storage": "denied",
            "functionality_storage": "denied",
            "security_storage": "denied",
    }
    gtag("consent","update", consentMode);
    localStorage.setItem("consentMode", JSON.stringify(consentMode));

    //hide cookie banner
    hideCookieBanner();
}

function hideCookieBanner(){
    document.getElementById("cookieBanner").style.visibility = "hidden";
    
}