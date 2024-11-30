// Check if a map or mode is multiplayer compatible. Some modes (country guesser, images... are singleplayer only).
export function mapSupportsMultiplayer(mapCategory) {
    if (mapCategory == "country_guesser" || mapCategory == "image_guesser") {
        return false;
    } else {
        return true;
    }
}