export function idToMapName(str) {
    try {
        return str
            .replaceAll("community_", " ")
            .replaceAll("_", " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    } catch {
        return "Error (?)";
    }
}