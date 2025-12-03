export function idToMapName(str) {
    try {
        return str
            .replaceAll("community_", "")
            .replaceAll("_", " ")
    } catch {
        return "Error (?)";
    }
}