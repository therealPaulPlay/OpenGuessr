import { derived, writable } from "svelte/store";

export const tournamentData = writable();
export const selectedTournamentId = writable({});
export const selectedTournament = derived([selectedTournamentId, tournamentData], ([$selectedTournamentId, $tournamentData], set) => {
    const tournament = $tournamentData?.filter((e) => e.id === $selectedTournamentId);
    set(tournament?.[0]);
});
export const tournamentMatchResultsIndex = writable(0);