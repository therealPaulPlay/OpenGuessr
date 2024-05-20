//Gamemode where you guess the country (not on the map)
import { hideToggleMapButtonIfMobile } from "./mainUI";

export let countryGuesserMode = false;
let selectedCountryGuesserCountry = null; //this will be set in locationGeneration.js


export function setCountryGuesserMode(enabled) {
    if (enabled) {
        countryGuesserMode = true;
        //hide map
        document.getElementById("map").style.visibility = "hidden";
        hideToggleMapButtonIfMobile(true);
        document.getElementById("revealCompass").style.visibility = "hidden";

        //show country picker UI
        document.getElementById("countryGuesserSelector").style.display = "flex";

    } else {
        countryGuesserMode = false;
        //show map
        document.getElementById("map").style.visibility = "visible";
        hideToggleMapButtonIfMobile(false);
        document.getElementById("revealCompass").style.visibility = "visible";

        //hide country picker UI
        document.getElementById("countryGuesserSelector").style.display = "none";

    }
}

export function setCountryGuesserCountry(country) {
    // Function to execute the main logic after DOM content is loaded
    function executeAfterDOMLoaded() {
        selectedCountryGuesserCountry = country;
        console.log(country); //This can be "South Africa", "United States", "India" and so on. Data was received by Nominatium API (which cannot be used in prod)
        try {
            if (countryGuesserMode) {
                for (let i = 1; i <= 6; i++) {
                    let countryItem = document.getElementById("countryTag" + i);
                    let countryFlag = document.getElementById("countryFlag" + i);

                    let randomCountryIndex = Math.floor(Math.random() * Object.keys(countryEmojis).length);

                    countryItem.textContent = Object.keys(countryEmojis)[randomCountryIndex];
                    countryFlag.textContent = countryEmojis[Object.keys(countryEmojis)[randomCountryIndex]];
                }
            }
        } catch (error) {
            console.error("Error generating random category options in countryGuesser.js: " + error);
        }
    }

    // Check if DOMContentLoaded event has already fired
    if (document.readyState === 'loading') {
        // If DOM content is not yet loaded, wait for it
        document.addEventListener('DOMContentLoaded', executeAfterDOMLoaded);
    } else {
        // If DOM content is already loaded, execute immediately
        executeAfterDOMLoaded();
    }
}


function getCountryEmoji(countryName) {
    return countryEmojis[countryName] || "X";
}

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
    "Czech Republic": "🇨🇿",
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
    "Taiwan, Republic of China": "🇹🇼",
    "Tanzania": "🇹🇿",
    "Ukraine": "🇺🇦",
    "Uganda": "🇺🇬",
    "United States Minor Outlying Islands": "🇺🇲",
    "United States of America": "🇺🇸",
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
