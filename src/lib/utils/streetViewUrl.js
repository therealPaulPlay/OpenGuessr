const streetViewLinkUrlPrefix = "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=";
const streetViewEmbedUrlPrefix = "https://www.google.com/maps/embed/v1/streetview?location=";
const key = "AIzaSyAHt3QJRBDISRaWaqblQl2VwjWiHvjpgIs";

export function openLocationOnMaps(lat, long, { heading = null, pitch = null, panoramaId = null } = {}) {
    window.open(buildUrl(lat, long, heading, pitch, panoramaId, false), '_blank');
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
    return `https://streetviewpixels-pa.googleapis.com/v1/tile?cb_client=apiv3&panoid=${encodeURIComponent(id)}&x=${x}&y=${y}&zoom=${zoom}`;
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

// Request the internal Maps JS service used by Google's own Street View, returns null on failure
const clientContext = ["apiv3", null, null, null, "US", null, null, null, null, null, [[0]]];
const imageOptions = [[1, 2, 3, 4, 8, 6]];

async function requestMapsJsService(method, body) {
    try {
        const response = await fetch(`https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/${method}`, {
            method: "POST",
            headers: { "Content-Type": "application/json+protobuf" },
            body: JSON.stringify(body),
        });
        return response.ok ? await response.json() : null;
    } catch {
        return null;
    }
}

// Get panorama data for provided coordinates (searches within a 50 meter radius)
export async function getPanoramaDataByCoords(lat, long, zoom) {
    const data = await requestMapsJsService("SingleImageSearch", [
        clientContext,
        [[null, null, lat, long], 50],
        [null, ["en", "GB"], null, null, null, null, null, null, [2], null, [[[2, true, 2]]]],
        imageOptions,
    ]);
    return parsePanoramaData(data?.[1], zoom);
}

// Get panorama data for a fixed panorama ID
export async function getPanoramaDataById(panoramaId, zoom) {
    const data = await requestMapsJsService("GetMetadata", [clientContext, ["en", "GB"], [[[2, panoramaId]]], imageOptions]);
    return parsePanoramaData(data?.[1]?.[0], zoom);
}