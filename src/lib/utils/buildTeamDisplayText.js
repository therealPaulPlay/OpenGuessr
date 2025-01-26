import { teamsDisplayText, teamAmount } from "$lib/stores/context-specific/multiplayerStore";
import { get } from "svelte/store";

export function buildTeamDisplayText(players) {
    const amountOfTeams = get(teamAmount); // Get the amount of teams from the store
    let teams = {}; // To store players by team
    let noTeamPlayers = []; // To store players with no team

    // Distribute players into teams based on their team index
    players.forEach((element) => {
        const teamIndex = element[4]; // Get the team index from player data
        if (amountOfTeams === 1) {
            noTeamPlayers.push(element[1]);
        } else {
            if (!teams[teamIndex]) teams[teamIndex] = [];
            teams[teamIndex].push(element[1]);
        }
    });

    let tempTeamsDisplayText = "";

    // Construct the display text
    if (amountOfTeams === 1) {
        tempTeamsDisplayText = "No team: " + noTeamPlayers.join(", ");
    } else {
        for (let i = 1; i <= amountOfTeams; i++) {
            if (teams[i] && teams[i].length > 0) {
                tempTeamsDisplayText += `Team ${i}: ${teams[i].join(", ")}\n`;
            }
        }
        if (noTeamPlayers.length > 0) {
            tempTeamsDisplayText += `No team: ${noTeamPlayers.join(", ")}`;
        }
    }

    // Remove any trailing newline or spaces
    teamsDisplayText.set(tempTeamsDisplayText.trim());
}