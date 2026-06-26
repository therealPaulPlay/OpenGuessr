export function openLocationOnMaps(lat, long, { heading = null, panoramaId = null } = {}) {
    const url =
        "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" +
        lat +
        "," +
        long +
        (panoramaId ? "&pano=" + panoramaId : "") +
        (heading ? "&heading=" + heading : "");
    window.open(url, '_blank').focus();
}