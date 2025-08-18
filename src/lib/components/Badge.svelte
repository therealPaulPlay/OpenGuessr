<script>
	// Must pass a "id" prop to load a badge!
	let { unlocked = false, id, interactive = false, display = false } = $props();
	import { selectedBadge } from "$lib/stores/accountStore";
	import { profileData } from "$lib/stores/context-specific/profileStore";
	import { setProfileBadge } from "$lib/utils/updateProfileData";
	import { playSound } from "$lib/utils/soundManager";
	import { onMount } from "svelte";

	const badges = {
		expBadge1: {
			title: "New Explorer",
			stage: 1,
		},
		expBadge2: {
			title: "Skilled Adventurer",
			stage: 2,
		},
		expBadge3: {
			title: "Experienced Veteran",
			stage: 3,
		},
		expBadge4: {
			title: "Master of Experience",
			stage: 4,
		},
		duelBadge1: {
			title: "Casual Duelist",
			stage: 1,
		},
		duelBadge2: {
			title: "Proven Combatant",
			stage: 2,
		},
		duelBadge3: {
			title: "Expert Duelist",
			stage: 3,
		},
		duelBadge4: {
			title: "Duel Master",
			stage: 4,
		},
		compBadge1: {
			title: "Rookie Competitor",
			stage: 1,
		},
		compBadge2: {
			title: "Dedicated Entrant",
			stage: 2,
		},
		compBadge3: {
			title: "Seasoned Contender",
			stage: 3,
		},
		compBadge4: {
			title: "Top Champion",
			stage: 4,
		},
		streakBadge1: {
			title: "Streak Starter",
			stage: 1,
		},
		streakBadge2: {
			title: "Consistent Performer",
			stage: 2,
		},
		streakBadge3: {
			title: "Streak Specialist",
			stage: 3,
		},
		streakBadge4: {
			title: "Ultimate Streaker",
			stage: 4,
		},
		supporterBadge1: {
			title: "Kind Contributor",
			stage: "Supporter2",
		},
		supporterBadge2: {
			title: "Generous Benefactor",
			stage: "Supporter3",
		},
		supporterBadge3: {
			title: "Ultimate Patron",
			stage: "Supporter4",
		},
		miscBadge1: {
			title: "Developer",
			stage: "Developer",
		},
	};

	// Reset badge that doesn't exist
	onMount(() => {
		if (!badges[id]) {
			id = "expBadge1";
			console.warn("This badge does not exist. Resetting to badge that does exist.");
		}
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	{id}
	role="button"
	tabindex="0"
	class="badge {'badgeStage' + badges[id]?.stage}"
	class:badgeLocked={!unlocked && !display}
	class:badgeSelected={$selectedBadge == id && !display}
	style:pointer-events={Boolean(interactive) ? "auto" : "none"}
	onclick={() => {
		if (unlocked) {
			playSound("item_select");
			setProfileBadge(id);
		} else {
			playSound("item_locked");
		}
	}}
>
	{badges[id]?.title}
</div>

<style>
	.badgeLocked {
		opacity: 0.35;
	}

	.badgeSelected {
		filter: brightness(1.5);
	}

	.badge {
		padding: var(--panel-margin);
		border-radius: 5px;
		font-style: italic;
		position: relative;
		color: white;
		font-size: 20px;
		text-wrap: nowrap;
		padding-inline: 12px;
		box-shadow: var(--button-shadow);
		cursor: pointer;
		transition:
			opacity 250ms ease,
			transform 250ms ease,
			filter 250ms ease,
			border 150ms ease;
		box-sizing: border-box;
		user-select: none;
	}

	.badge:hover {
		transform: scale(0.97);
	}

	.badgeStage1 {
		background: linear-gradient(0.6turn, rgb(136, 113, 113), #6f5a5a);
	}

	.badgeStage2 {
		background: linear-gradient(0.6turn, #30929b, #507d82);
	}

	.badgeStage3 {
		background: linear-gradient(0.6turn, rgb(142, 70, 232), #7954a6);
	}

	.badgeStage4 {
		background: linear-gradient(0.6turn, #ddbb1f, #aa8928);
	}

	.badgeStageSupporter1 {
		background: linear-gradient(0.6turn, #419d42, #4d684a);
	}

	.badgeStageSupporter2 {
		background: linear-gradient(0.6turn, #319532, #568851);
	}

	.badgeStageSupporter3 {
		background: linear-gradient(0.6turn, #19ae1b, #459337);
	}

	.badgeStageSupporter4 {
		background: linear-gradient(0.6turn, #37d738, #22a826);
	}

	.badgeStageDeveloper {
		background: linear-gradient(0.6turn, #e31f1f, #8e3030);
	}
</style>
