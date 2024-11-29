// Used for map submissions, competition submissions etc.

// Convert streetview links to json file:
export function extractCoordinates(text) {
    try {
        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/g;
        const coordinates = [];
        const seenCoordinates = new Set();
        let match;

        while ((match = regex.exec(text)) !== null) {
            const lat = parseFloat(match[1]);
            const long = parseFloat(match[2]);
            const coordPair = `${lat},${long}`;

            if (!seenCoordinates.has(coordPair)) {
                coordinates.push([lat, long]);
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