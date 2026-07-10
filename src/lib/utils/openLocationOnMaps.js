export function openLocationOnMaps(lat, long, { heading = null, pitch = null, panoramaId = null } = {}) {
    const url =
        "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" +
        lat +
        "," +
        long +
        (heading != null ? "&heading=" + heading : "") +
        (pitch != null ? "&pitch=" + pitch : "") +
        (panoramaId ? "&pano=" + panoramaId : "");
    window.open(url, '_blank').focus();
}