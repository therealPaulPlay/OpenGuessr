// Check if a map or mode is multiplayer compatible. Some modes (country guessr, images... are singleplayer only).
export function mapSupportsMultiplayer(mapCategory) {
    if (mapCategory == "country guessr" || mapCategory == "image guessr") {
        return false;
    } else {
        return true;
    }
}