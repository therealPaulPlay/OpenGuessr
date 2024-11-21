// Check if a map or mode is multiplayer compatible. Some modes (country guesser, images... are singleplayer only).
export function mapSupportsMultiplayer(mapCategory) {
    if (mapCategory == "country" || mapCategory == "image") {
        return false;
    } else {
        return true;
    }
}