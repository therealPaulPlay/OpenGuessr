import * as topojson from 'topojson-client';

let worldData = null;
let countriesGeo = null;

// Load the TopoJSON data
async function loadWorldData() {
    if (worldData) return;
    try {
        const response = await fetch("/json/topojson/countries-70m.json");
        worldData = await response.json();
        countriesGeo = topojson.feature(worldData, worldData.objects.countries).features; // Convert TopoJSON to GeoJSON
    } catch (error) {
        console.error("Error loading topology:", error);
    }
}

// Simple point in polygon test
function pointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

// Get country from coordinates with nearest neighbor fallback
export async function getCountryFromCoords(lat, lon) {
    if (!countriesGeo) await loadWorldData();

    // Canonicalize lon
    // For example, if lon is 185 degrees, lon/360 >= 0.5, so it wraps it back by 360, making that -175 in this case
    lon = lon - Math.round(lon / 360) * 360;

    const point = [lon, lat];

    // First try exact point-in-polygon
    for (const country of countriesGeo) {
        if (!country.geometry) continue;

        const { type, coordinates } = country.geometry;

        if (type === 'Polygon') {
            if (pointInPolygon(point, coordinates[0])) {
                return country.properties.name;
            }
        }
        else if (type === 'MultiPolygon') {
            for (const polygon of coordinates) {
                if (pointInPolygon(point, polygon[0])) {
                    return country.properties.name;
                }
            }
        }
    }

    // If no match, find nearest country (for coastal points)
    let closestDistance = Infinity;
    let closestCountry = "Unknown";

    for (const country of countriesGeo) {
        if (!country.geometry) continue;

        const { type, coordinates } = country.geometry;
        let minDistance = Infinity;

        if (type === 'Polygon') {
            minDistance = minDistanceToPolygon(point, coordinates[0]);
        }
        else if (type === 'MultiPolygon') {
            for (const polygon of coordinates) {
                const d = minDistanceToPolygon(point, polygon[0]);
                if (d < minDistance) minDistance = d;
            }
        }

        if (minDistance < closestDistance) {
            closestDistance = minDistance;
            closestCountry = country.properties.name;
        }
    }

    // Only return the closest country if it's reasonably close
    return closestDistance < 1 ? closestCountry : "Unknown";
}

// Calculate minimum distance from point to polygon
function minDistanceToPolygon(point, polygon) {
    let minDist = Infinity;

    for (let i = 0; i < polygon.length; i++) {
        const j = (i + 1) % polygon.length;
        const dist = distanceToLineSegment(
            point,
            polygon[i],
            polygon[j]
        );
        if (dist < minDist) minDist = dist;
    }

    return minDist;
}

// Calculate distance from point to line segment
function distanceToLineSegment(point, lineStart, lineEnd) {
    const [x, y] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;

    return Math.sqrt(dx * dx + dy * dy);
}