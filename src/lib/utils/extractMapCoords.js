// Used for map submissions, competition submissions etc.

// Convert streetview links to json file
export function extractCoordinates(text) {
    try {
        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)([^@\s]*)/g;
        const headingRegex = /,(\d+(?:\.\d+)?)h(?=[,/]|$)/; // e.g. 2.85h in @44.42,20.88,3a,75y,2.85h,90t (omitted when the heading is 0), note that t doesn't map to pitch (t is 0-180, pitch is -90-90)
        const coordinates = [];
        const seenCoordinates = new Set();
        let match;

        while ((match = regex.exec(text)) !== null) {
            const lat = parseFloat(match[1]);
            const lon = parseFloat(match[2]);
            const coordPair = `${lat},${lon}`;

            if (!seenCoordinates.has(coordPair)) {
                const headingMatch = match[3].match(headingRegex);
                coordinates.push(headingMatch ? [lat, lon, { heading: parseFloat(headingMatch[1]) }] : [lat, lon]);
                seenCoordinates.add(coordPair);
            }
        }

        // Wrap coordinates with the outer object
        const output = JSON.stringify({ locations: coordinates }, null, 2);

        return output;
    } catch (error) {
        console.error("Error in extractCoordinates: " + error);
    }
}

// Get String from JSON file
export async function getJsonStringFromFile(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = function (e) {
            const jsonString = e.target.result;
            try {
                JSON.parse(jsonString); // Validate JSON format
                resolve(jsonString);
            } catch (error) {
                reject(new Error("Failed to parse JSON: " + error));
            }
        };
        reader.onerror = function (e) {
            reject(new Error("Failed to read file: " + e));
        };
        reader.readAsText(file);
    });
}