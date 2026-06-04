const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

// Region codes from svelte-flag-icons that aren't ISO
const regionNames = {
    EsCt: "Catalonia",
    EsGa: "Galicia",
    EsPv: "Basque Country",
    GbEng: "England",
    GbNir: "Northern Ireland",
    GbSct: "Scotland",
    GbWls: "Wales",
};

// Resolves a flag code from svelte-flag-icons or ISO code (e.g. US) to a country name
export function getCountryName(code) {
    if (!code) return null;

    const iso = code.toUpperCase();
    const region = Object.entries(regionNames).find(([key]) => key.toUpperCase() === iso);
    if (region) return region[1];

    try {
        const name = displayNames.of(iso);
        return name === iso ? null : name; // Intl returns the input unchanged for unknown regions
    } catch {
        return null;
    }
}