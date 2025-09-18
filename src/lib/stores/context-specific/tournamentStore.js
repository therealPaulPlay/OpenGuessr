import { derived, writable } from "svelte/store";

export const tournamentData = writable([
    {
        id: 1,
        name: "Weekend tournament",
        date: "2025-09-26 16:00:00",
        saves: 239,
        prize: "500 tokens",
        status: "ongoing",
        matches: [],
        winner: {},
        map: "standard",
    },
    {
        id: 12,
        name: "Fun tournament",
        date: "2025-10-02 15:00:00",
        saves: 219,
        saved: true,
        prize: "Supporter tier 1",
        status: "upcoming",
        matches: [],
        winner: {},
        map: "famous_places",
    },
    {
        id: 16,
        name: "Big tournament",
        date: "2025-09-07 13:00:00",
        saves: 160,
        prize: "750 tokens",
        status: "finished",
        map: "standard",
        matches: [
            {
                ascendedPlayers: [
                    { username: "Max F.", id: 232, score: 34502 },
                    { username: "Szu Wuzu 55", id: 235, score: 32502 },
                    { username: "I will win against everyone else every time", id: 259, score: 24502 },
                    { username: "Rungunner", id: 412, score: 32502 },
                    { username: "Marchel 43", id: 952, score: 21902 },
                    { username: "Mila five", id: 845, score: 22343 },
                    { username: "Cool andy", id: 299, score: 11522 },
                    { username: "Rowell", id: 1254, score: 1902 },
                    { username: "Hartig Sartig", id: 2344, score: 23902 },
                ],
                eliminatedPlayers: [
                    { username: "Goodguy", id: 3423, score: 11340 },
                    { username: "Heavy Metal King", id: 773, score: 3390 },
                    { username: "Frunkinator", id: 3428, score: 0 },
                    { username: "Parrol23ROL", id: 949, score: 7529 },
                    { username: "HeldigHeldig", id: 539, score: 335 },
                ],
            },
            {
                ascendedPlayers: [
                    { username: "Marchel 43", id: 952, score: 29902 },
                    { username: "Mila five", id: 845, score: 26999 },
                    { username: "Cool andy", id: 299, score: 23500 },
                    { username: "Rowell", id: 1254, score: 20454 },
                    { username: "Hartig Sartig", id: 2344, score: 2635 },
                ],
                eliminatedPlayers: [
                    { username: "Max F.", id: 3423, score: 11340 },
                    { username: "Rungunner", id: 773, score: 3390 },
                    { username: "Marchel 43", id: 3428, score: 0 },
                ],
            },
            {
                ascendedPlayers: [
                    { username: "Cool andy", id: 299, score: 23599 },
                    { username: "Rowell", id: 1254, score: 27909 },
                    { username: "Hartig Sartig", id: 2344, score: 25200 },
                ],
                eliminatedPlayers: [{ username: "Hartig Sartig", id: 3423, score: 11340 }],
            },
            {
                ascendedPlayers: [
                    { username: "Cool andy", id: 299, score: 28100 },
                    { username: "Rowell", id: 1254, score: 28200 },
                ],
                eliminatedPlayers: [{ username: "Hartig Sartig", id: 3423, score: 11340 }],
            },
            {
                ascendedPlayers: [{ username: "Rowell", id: 1254, score: 22005 }],
                eliminatedPlayers: [{ username: "Cool andy", id: 3423, score: 11340 }],
            },
        ],
        winner: { name: "Rowell", id: 1254 },
    },
]);
export const selectedTournamentId = writable({});
export const selectedTournament = derived([selectedTournamentId, tournamentData], ([$selectedTournamentId, $tournamentData], set) => {
    const tournament = $tournamentData?.filter((e) => e.id === $selectedTournamentId);
    set(tournament?.[0]);
});
export const tournamentMatchResultsIndex = writable(0);