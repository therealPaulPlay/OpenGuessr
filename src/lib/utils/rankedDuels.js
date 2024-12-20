// Ranked Duels logic and API
export function calculateDivision(elo) {
    if (elo < 1200) return 4;      // V   (index 0 in the UI)
    if (elo < 1400) return 3;      // IV  (index 1 in the UI)
    if (elo < 1600) return 2;      // III (index 2 in the UI)
    if (elo < 2000) return 1;      // II  (index 3 in the UI)
    return 0;                       // I   (index 4 in the UI)
}