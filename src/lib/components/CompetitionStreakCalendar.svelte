<script>
	import { Check, Clock, X } from "@lucide/svelte";

	let { streakDays = [], compact = false } = $props(); // "YYYY-MM-DD" UTC days the user entered the daily comp

	const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	let lastFiveDays = $derived.by(() => {
		const playedDays = new Set(streakDays);
		let result = [];

		// Days roll over at UTC midnight, same as the daily competition itself
		for (let daysAgo = 4; daysAgo >= 0; daysAgo--) {
			const date = new Date();
			date.setUTCDate(date.getUTCDate() - daysAgo);
			const day = date.toISOString().slice(0, 10);

			result.push({ name: DAYS[(date.getUTCDay() + 6) % 7], played: playedDays.has(day), isToday: daysAgo === 0 });
		}

		return result;
	});
</script>

<div class="daily-competition-days-container" class:compact-container={compact}>
	<div class="days-scroll of-left of-right">
		{#each lastFiveDays as day}
			<div class="streak-day-item" style:opacity={day.played ? "" : 0.5}>
				<div style:height={compact ? "calc(var(--layout-margin) + var(--content-margin))" : ""}>
					{#if day.played}
						<Check size={20} strokeWidth={2.25} />
					{:else if day.isToday}
						<Clock size={18} strokeWidth={2.5} />
					{:else}
						<X size={20} strokeWidth={2.25} />
					{/if}
				</div>
				<p class="streak-day-name">{day.name}</p>
			</div>
		{/each}
	</div>
</div>

<style>
	.daily-competition-days-container {
		background-color: var(--box-color);
		padding: var(--box-margin);
		border-radius: var(--box-margin);
		box-shadow: var(--box-shadow);
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
		width: 100%;
		transition: opacity 250ms ease;
	}

	.compact-container {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		margin-top: calc(-1 * var(--box-margin));
		padding-top: calc(var(--layout-margin) + var(--content-margin));
		mask-image: linear-gradient(transparent, black 40%);
	}

	.days-scroll {
		overflow-x: auto;
		scrollbar-width: none;
		display: flex;
		justify-content: safe center;
		gap: var(--box-margin);
	}

	.compact-container .days-scroll {
		gap: var(--content-margin);
	}

	.streak-day-item {
		min-width: 25px;
		flex-grow: 1;
		padding: var(--content-margin);
		background-color: var(--box-color);
		border-radius: var(--content-margin);
		box-shadow: var(--box-shadow);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-basis: 0;
		transition: opacity 250ms ease;
	}

	.streak-day-item div {
		display: flex;
		justify-content: center;
		align-items: center;
		color: white;
		flex-grow: 1;
	}

	.streak-day-name {
		font-size: 18px;
		opacity: 0.5;
		text-wrap: nowrap;
	}
</style>
