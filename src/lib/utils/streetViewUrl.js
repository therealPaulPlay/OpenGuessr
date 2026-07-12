const streetViewLinkUrlPrefix = "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=";
const streetViewEmbedUrlPrefix = "https://www.google.com/maps/embed/v1/streetview?location=";
const key = "AIzaSyAHt3QJRBDISRaWaqblQl2VwjWiHvjpgIs";

export function openLocationOnMaps(lat, long, { heading = null, pitch = null, panoramaId = null } = {}) {
    window.open(buildUrl(lat, long, heading, pitch, panoramaId, false), '_blank').focus();
}

export function getMapsEmbedUrl(lat, long, { heading = null, pitch = null, panoramaId = null } = {}) {
    return buildUrl(lat, long, heading, pitch, panoramaId, true);
}

// Build URL for embedding or link
// Language is forced as English since languages read from right to left invert the control placement
function buildUrl(lat, long, heading, pitch, panoramaId, embed = true) {
    const url =
        (embed ? streetViewEmbedUrlPrefix : streetViewLinkUrlPrefix) +
        lat +
        "," +
        long +
        (embed ? "&key=" + key + "&fov=90&language=en" : "") +
        (heading != null ? "&heading=" + heading : "") +
        (pitch != null ? "&pitch=" + pitch : "") +
        (panoramaId ? "&pano=" + panoramaId : "");

    return url;
}
