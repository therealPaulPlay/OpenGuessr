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

// Get the URL for a single SV tile image
export function getPanoramaTileUrl(id, x, y, zoom) {
    return `https://streetviewpixels-pa.googleapis.com/v1/tile?cb_client=maps_sv.tactile&panoid=${encodeURIComponent(id)}&x=${x}&y=${y}&zoom=${zoom}&nbt=1&fover=2`;
}

// Get panorama ID for provided coordinates
export function getPanoramaData(lat, long, zoom) {
    return new Promise((resolve) => {
        const callback = `panoramaLookup${Math.random().toString(36).slice(2)}`;
        const script = document.createElement("script");

        const cleanup = (panorama) => {
            delete window[callback];
            script.remove();
            resolve(panorama);
        };
        script.onerror = () => cleanup(null);

        // Listen to callback from script (returns null if no panorama was found)
        window[callback] = (data) => {
            const id = data?.[1]?.[1]?.[1];
            const levels = data?.[1]?.[2]?.[3]?.[0]; // Image [height, width], for each zoom level
            if (!id || !levels?.length) return cleanup(null);

            const [height, width] = levels[Math.min(zoom, levels.length - 1)][0];
            cleanup({ id, width, height, heading: data[1][5][0][1][2][0] });
        };

        script.src = `https://maps.googleapis.com/maps/api/js/GeoPhotoService.SingleImageSearch?pb=!1m5!1sapiv3!5sUS!11m2!1m1!1b0!2m4!1m2!3d${lat}!4d${long}!2d50!3m10!2m2!1sen!2sGB!9m1!1e2!11m4!1m3!1e2!2b1!3e2!4m6!1e1!1e4!5m1!1e2!6m1!1e2&callback=${callback}`;
        document.head.appendChild(script);
    });
}