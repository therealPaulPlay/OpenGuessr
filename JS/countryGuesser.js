//Gamemode where you guess the country (not on the map)
import { hideToggleMapButtonIfMobile } from "./mainUI";
import { setConfirmButtonEnabled, confirmButtonClicks } from "./miniMap";
import { multiplayer } from "./multiplayer";
import { playSound } from "./soundManager";

export let countryGuesserMode = false;
export let selectedCountryGuesserCountry = null; //this will be set in locationGeneration.js and is the country
let selectedCountryGuessIndex = null; //this is the field the user has selected in the UI 
let correctCountryField = null; // 1-6


export function setCountryGuesserMode(enabled) {
    if (enabled) {
        countryGuesserMode = true;
        //hide map
        if (!multiplayer) {
            document.getElementById("map").style.visibility = "hidden";
            hideToggleMapButtonIfMobile(true);
        }

        //show country picker UI
        document.getElementById("countryGuesserSelector").style.display = "flex";

    } else {
        countryGuesserMode = false;
        //show map
        if (!multiplayer) {
            document.getElementById("map").style.visibility = "visible";
            hideToggleMapButtonIfMobile(false);
        }

        //hide country picker UI
        document.getElementById("countryGuesserSelector").style.display = "none";

    }
}

export function checkIfGuessWasCorrect() {
    if (correctCountryField == selectedCountryGuessIndex) {
        return true;
    } else {
        return false;
    }
}

export function setCountryGuesserCountry(country) {
    selectedCountryGuesserCountry = country; //This can be "South Africa", "United States", "India" and so on. Data was received by Nominatium API (which cannot be used in prod)
    clearSelection();
    try {
        if (countryGuesserMode) {
            let takenLocations = []; //to avoid duplicates amongst the 6 random / wrong ones (one of them will be replaced by the correct one)
            for (let i = 1; i <= 6; i++) {
                let countryItem = document.getElementById("countryTag" + i);
                let countryFlag = document.getElementById("countryFlag" + i);
                let randomCountryIndex = Math.floor(Math.random() * Object.keys(countryEmojis).length);

                //avoid duplicates and avoid a random country matching the corect country
                while (Object.keys(countryEmojis)[randomCountryIndex] == selectedCountryGuesserCountry || takenLocations.includes(Object.keys(countryEmojis)[randomCountryIndex])) {
                    randomCountryIndex = Math.floor(Math.random() * Object.keys(countryEmojis).length);
                }

                const countryName = Object.keys(countryEmojis)[randomCountryIndex];

                countryItem.textContent = countryName;
                countryFlag.textContent = countryEmojis[countryName];

                takenLocations.push(countryName);

                if (countryName.length > 17) {
                    countryItem.textContent = countryName.slice(0, 14) + "...";
                }
            }

            //now make one of them the actual answer (1-6)
            correctCountryField = Math.floor(Math.random() * 6) + 1;
            let countryItem = document.getElementById("countryTag" + correctCountryField);
            let countryFlag = document.getElementById("countryFlag" + correctCountryField);

            const countryName = selectedCountryGuesserCountry;

            countryItem.textContent = countryName;
            countryFlag.textContent = countryEmojis[countryName];

            if (countryName.length > 17) {
                countryItem.textContent = countryName.slice(0, 14) + "...";
            }

        }
    } catch (error) {
        console.error("Error generating random category options in countryGuesser.js: " + error);
    }
}

//UI selection --------------------------------------------------------------------------------------------------------
const countryGuesserHolders = document.querySelectorAll('.countryGuesserHolder');

countryGuesserHolders.forEach((holder, index) => {
    holder.addEventListener('click', () => {
        countryGuesserHolders.forEach(h => h.classList.remove('selectedCountry'));

        holder.classList.add('selectedCountry');
        playSound("item_select");

        selectedCountryGuessIndex = index + 1;

        setConfirmButtonEnabled();
    });
});

function clearSelection() {
    countryGuesserHolders.forEach(h => h.classList.remove('selectedCountry'));
    selectedCountryGuessIndex = null;
}

//Spacebar click to guess ---------------------------------------------------------------------------------------------

//Confirm Button with Spacebar and a few checks
document.getElementById("countryGuesserSelector").addEventListener("keyup", function (event) {
    if (event.key === " ") {
        if (document.getElementById("confirmButton").style.pointerEvents == "auto") {
            confirmButtonClicks();
        } else {
            console.warn("Cannot click on confirm button - pointer events is none.");
        }
    }
});

//Country emojis --------------------------------------------------------------------------------------------------------

const countryEmojis = {
    "Andorra": "🇦🇩",
    "United Arab Emirates": "🇦🇪",
    "Antigua and Barbuda": "🇦🇬",
    "Anguilla": "🇦🇮",
    "Albania": "🇦🇱",
    "Armenia": "🇦🇲",
    "Angola": "🇦🇴",
    "Argentina": "🇦🇷",
    "American Samoa": "🇦🇸",
    "Austria": "🇦🇹",
    "Australia": "🇦🇺",
    "Aruba": "🇦🇼",
    "Azerbaijan": "🇦🇿",
    "Bosnia and Herzegovina": "🇧🇦",
    "Barbados": "🇧🇧",
    "Bangladesh": "🇧🇩",
    "Belgium": "🇧🇪",
    "Burkina Faso": "🇧🇫",
    "Bulgaria": "🇧🇬",
    "Bahrain": "🇧🇭",
    "Burundi": "🇧🇮",
    "Benin": "🇧🇯",
    "Bermuda": "🇧🇲",
    "Brunei Darussalam": "🇧🇳",
    "Bolivia": "🇧🇴",
    "Brazil": "🇧🇷",
    "Bahamas": "🇧🇸",
    "Bhutan": "🇧🇹",
    "Botswana": "🇧🇼",
    "Belarus": "🇧🇾",
    "Belize": "🇧🇿",
    "Canada": "🇨🇦",
    "Cocos (Keeling) Islands": "🇨🇨",
    "Democratic Republic of the Congo (Congo-Kinshasa, former Zaire)": "🇨🇩",
    "Centrafrican Republic": "🇨🇫",
    "Republic of the Congo (Congo-Brazzaville)": "🇨🇬",
    "Switzerland": "🇨🇭",
    "Côte d'Ivoire": "🇨🇮",
    "Cook Islands": "🇨🇰",
    "Chile": "🇨🇱",
    "Cameroon": "🇨🇲",
    "China": "🇨🇳",
    "Colombia": "🇨🇴",
    "Costa Rica": "🇨🇷",
    "Cuba": "🇨🇺",
    "Cabo Verde": "🇨🇻",
    "Curaçao": "🇨🇼",
    "Christmas Island": "🇨🇽",
    "Cyprus": "🇨🇾",
    "Czechia": "🇨🇿",
    "Germany": "🇩🇪",
    "Djibouti": "🇩🇯",
    "Denmark": "🇩🇰",
    "Dominica": "🇩🇲",
    "Dominican Republic": "🇩🇴",
    "Algeria": "🇩🇿",
    "Ecuador": "🇪🇨",
    "Estonia": "🇪🇪",
    "Egypt": "🇪🇬",
    "Western Sahara": "🇪🇭",
    "Eritrea": "🇪🇷",
    "Spain": "🇪🇸",
    "Ethiopia": "🇪🇹",
    "Finland": "🇫🇮",
    "Fiji": "🇫🇯",
    "Falkland Islands": "🇫🇰",
    "Micronesia (Federated States of)": "🇫🇲",
    "Faroe Islands": "🇫🇴",
    "France": "🇫🇷",
    "Gabon": "🇬🇦",
    "United Kingdom": "🇬🇧",
    "Grenada": "🇬🇩",
    "Georgia": "🇬🇪",
    "French Guiana": "🇬🇫",
    "Guernsey": "🇬🇬",
    "Ghana": "🇬🇭",
    "Gibraltar": "🇬🇮",
    "Greenland": "🇬🇱",
    "The Gambia": "🇬🇲",
    "Guinea": "🇬🇳",
    "Guadeloupe": "🇬🇵",
    "Equatorial Guinea": "🇬🇶",
    "Greece": "🇬🇷",
    "Guatemala": "🇬🇹",
    "Guam": "🇬🇺",
    "Guinea Bissau": "🇬🇼",
    "Guyana": "🇬🇾",
    "Hong Kong (SAR of China)": "🇭🇰",
    "Heard Island and McDonald Islands": "🇭🇲",
    "Honduras": "🇭🇳",
    "Croatia": "🇭🇷",
    "Haiti": "🇭🇹",
    "Hungary": "🇭🇺",
    "Indonesia": "🇮🇩",
    "Ireland": "🇮🇪",
    "Israel": "🇮🇱",
    "Isle of Man": "🇮🇲",
    "India": "🇮🇳",
    "British Indian Ocean Territory": "🇮🇴",
    "Iraq": "🇮🇶",
    "Iran": "🇮🇷",
    "Iceland": "🇮🇸",
    "Italy": "🇮🇹",
    "Jersey": "🇯🇪",
    "Jamaica": "🇯🇲",
    "Jordan": "🇯🇴",
    "Japan": "🇯🇵",
    "Kenya": "🇰🇪",
    "Kyrgyzstan": "🇰🇬",
    "Cambodia": "🇰🇭",
    "Kiribati": "🇰🇮",
    "Comores": "🇰🇲",
    "Saint Kitts and Nevis": "🇰🇳",
    "North Korea": "🇰🇵",
    "South Korea": "🇰🇷",
    "Kuwait": "🇰🇼",
    "Cayman Islands": "🇰🇾",
    "Kazakhstan": "🇰🇿",
    "Laos": "🇱🇦",
    "Lebanon": "🇱🇧",
    "Saint Lucia": "🇱🇨",
    "Liechtenstein": "🇱🇮",
    "Sri Lanka": "🇱🇰",
    "Liberia": "🇱🇷",
    "Lesotho": "🇱🇸",
    "Lithuania": "🇱🇹",
    "Luxembourg": "🇱🇺",
    "Latvia": "🇱🇻",
    "Libya": "🇱🇾",
    "Morocco": "🇲🇦",
    "Monaco": "🇲🇨",
    "Moldova": "🇲🇩",
    "Montenegro": "🇲🇪",
    "Saint Martin (French part)": "🇲🇫",
    "Madagascar": "🇲🇬",
    "Marshall Islands": "🇲🇭",
    "North Macedonia": "🇲🇰",
    "Mali": "🇲🇱",
    "Myanmar": "🇲🇲",
    "Mongolia": "🇲🇳",
    "Macao (SAR of China)": "🇲🇴",
    "Northern Mariana Islands": "🇲🇵",
    "Martinique": "🇲🇶",
    "Mauritania": "🇲🇷",
    "Montserrat": "🇲🇸",
    "Malta": "🇲🇹",
    "Mauritius": "🇲🇺",
    "Maldives": "🇲🇻",
    "Malawi": "🇲🇼",
    "Mexico": "🇲🇽",
    "Malaysia": "🇲🇾",
    "Mozambique": "🇲🇿",
    "Namibia": "🇳🇦",
    "New Caledonia": "🇳🇨",
    "Niger": "🇳🇪",
    "Norfolk Island": "🇳🇫",
    "Nigeria": "🇳🇬",
    "Nicaragua": "🇳🇮",
    "Netherlands": "🇳🇱",
    "Norway": "🇳🇴",
    "Nepal": "🇳🇵",
    "Nauru": "🇳🇷",
    "New Zealand": "🇳🇿",
    "Oman": "🇴🇲",
    "Panama": "🇵🇦",
    "Peru": "🇵🇪",
    "French Polynesia": "🇵🇫",
    "Papua New Guinea": "🇵🇬",
    "Philippines": "🇵🇭",
    "Pakistan": "🇵🇰",
    "Poland": "🇵🇱",
    "Saint Pierre and Miquelon": "🇵🇲",
    "Pitcairn": "🇵🇳",
    "Puerto Rico": "🇵🇷",
    "Palestinian Territory": "🇵🇸",
    "Portugal": "🇵🇹",
    "Palau": "🇵🇼",
    "Paraguay": "🇵🇾",
    "Qatar": "🇶🇦",
    "Reunion": "🇷🇪",
    "Romania": "🇷🇴",
    "Serbia": "🇷🇸",
    "Russia": "🇷🇺",
    "Rwanda": "🇷🇼",
    "Saudi Arabia": "🇸🇦",
    "Solomon Islands": "🇸🇧",
    "Seychelles": "🇸🇨",
    "Sudan": "🇸🇩",
    "Sweden": "🇸🇪",
    "Singapore": "🇸🇬",
    "Saint Helena": "🇸🇭",
    "Slovenia": "🇸🇮",
    "Svalbard and Jan Mayen": "🇸🇯",
    "Slovakia": "🇸🇰",
    "Sierra Leone": "🇸🇱",
    "San Marino": "🇸🇲",
    "Sénégal": "🇸🇳",
    "Somalia": "🇸🇴",
    "Suriname": "🇸🇷",
    "São Tomé and Príncipe": "🇸🇹",
    "El Salvador": "🇸🇻",
    "Sint Maarten (Dutch part)": "🇸🇽",
    "Syrian Arab Republic": "🇸🇾",
    "Eswatini": "🇸🇿",
    "Turks and Caicos Islands": "🇹🇨",
    "Chad": "🇹🇩",
    "French Southern Territories": "🇹🇫",
    "Togo": "🇹🇬",
    "Thailand": "🇹🇭",
    "Tajikistan": "🇹🇯",
    "Tokelau": "🇹🇰",
    "Timor-Leste": "🇹🇱",
    "Turkmenistan": "🇹🇲",
    "Tunisia": "🇹🇳",
    "Tonga": "🇹🇴",
    "Turkey": "🇹🇷",
    "Trinidad and Tobago": "🇹🇹",
    "Tuvalu": "🇹🇻",
    "Taiwan": "🇹🇼",
    "Tanzania": "🇹🇿",
    "Ukraine": "🇺🇦",
    "Uganda": "🇺🇬",
    "United States": "🇺🇸",
    "Uruguay": "🇺🇾",
    "Uzbekistan": "🇺🇿",
    "Vatican City": "🇻🇦",
    "Saint Vincent and the Grenadines": "🇻🇨",
    "Venezuela": "🇻🇪",
    "British Virgin Islands": "🇻🇬",
    "US Virgin Islands": "🇻🇮",
    "Viet Nam": "🇻🇳",
    "Vanuatu": "🇻🇺",
    "Wallis and Futuna": "🇼🇫",
    "Samoa": "🇼🇸",
    "Yemen": "🇾🇪",
    "Mayotte": "🇾🇹",
    "South Africa": "🇿🇦",
    "Zambia": "🇿🇲",
    "Zimbabwe": "🇿🇼"
};
