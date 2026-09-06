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

// Parse the panorama data
function parsePanoramaData(panorama, zoom) {
    const id = panorama?.[1]?.[1];
    const dimensionsPerZoomLevel = panorama?.[2]?.[3]?.[0]; // Image height x width, for each zoom level
    if (!id || !dimensionsPerZoomLevel?.length) return null;

    const cameraViewData = panorama[5]?.find((entry) => entry?.[1]?.[2]?.length === 3)?.[1][2];
    const [height, width] = dimensionsPerZoomLevel[Math.min(zoom, dimensionsPerZoomLevel.length - 1)][0]; // Extract dimensions

    return { id, width, height, heading: cameraViewData?.[0] ?? 0 };
}

// Get panorama data for provided coordinates
export function getPanoramaDataByCoords(lat, long, zoom) {
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
        window[callback] = (data) => cleanup(parsePanoramaData(data?.[1], zoom));

        script.src = `https://maps.googleapis.com/maps/api/js/GeoPhotoService.SingleImageSearch?pb=!1m5!1sapiv3!5sUS!11m2!1m1!1b0!2m4!1m2!3d${lat}!4d${long}!2d50!3m10!2m2!1sen!2sGB!9m1!1e2!11m4!1m3!1e2!2b1!3e2!4m6!1e1!1e4!5m1!1e2!6m1!1e2&callback=${callback}`;
        document.head.appendChild(script);
    });
}

// Get panorama data for a fixed panorama ID
export async function getPanoramaDataById(panoramaId, zoom) {
    try {
        const response = await fetch(
            `https://www.google.com/maps/photometa/v1?authuser=0&hl=en&gl=us&pb=!1m4!1smaps_sv.tactile!11m2!2m1!1b1!2m2!1sen!2sus!3m3!1m2!1e2!2s${encodeURIComponent(panoramaId)}!4m6!1e1!1e4!5m1!1e2!6m1!1e2`,
        );

        return parsePanoramaData(JSON.parse((await response.text()).slice(5))?.[1]?.[0], zoom);
    } catch {
        return null;
    }
}