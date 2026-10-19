export function idToMapName(str) {
    try {
        return str
            .replaceAll("community_", "")
            .replaceAll("_", " ")
    } catch {
        return "Error (?)";
    }
}

export function formatMapNameForUrl(name = "") {
    return name.split(" ").join("_").toLowerCase();
}