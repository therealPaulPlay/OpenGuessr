export function openLocationOnMaps(lat, long) {
    window.open("https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" + lat + "," + long, '_blank').focus();
}