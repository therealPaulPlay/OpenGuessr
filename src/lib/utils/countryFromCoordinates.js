let gridData = null;

async function loadDataset() {
    const response = await fetch("/json/countries.json");
    gridData = await response.json();
}

export async function getCountryFromCoords(lat, lon) {
    if (!gridData) await loadDataset();
    
    try {
        const gridSize = gridData.grid_size;
        const latIndex = Math.floor(lat / gridSize);
        const lonIndex = Math.floor(lon / gridSize);
        const key = `${latIndex},${lonIndex}`;
        return gridData.data[key] || "Unknown";
    } catch (error) {
        console.error("Error getting country from coords: " + error);
        return "Uknknown";
    }
}