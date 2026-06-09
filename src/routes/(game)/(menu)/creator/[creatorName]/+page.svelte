<script>
	import { blur, fly } from "svelte/transition";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { ArrowRight } from "@lucide/svelte";
	import { page } from "$app/stores";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
	import { playSound } from "$lib/utils/soundManager";

	let creator = $derived($page.params?.creatorName || "No creator");

	let mounted = $state(false);

	onMount(async () => {
		mounted = true;

		if (creator) {
			try {
				await fetch($apiUrl + "/creators/creator-link-statistic", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						creator,
					}),
				});
			} catch (error) {
				console.error("Error collecting creator stats:", error);
			}
		}
	});
</script>

<svelte:head>
	<title>Creator link</title>
</svelte:head>

<div class="main-container">
	{#if mounted}
		<div class="centerBox">
			<h1 class="welcomeHeader" in:fly={{ y: -20, duration: 1000 }}>Applause for {creator}!</h1>
			<div class="creditBox">
				<p class="creditNote" in:blur={{ duration: 500 }}>Now, let's kick off your geography journey.</p>
			</div>
			<div class="barMenu buttonContainer" in:fly={{ y: 20, duration: 1000 }}>
				<button
					class="standardButton largeButton"
					onclick={() => {
						playSound("basic_button");
						goto("/");
					}}
				>
					Let's go
					<ArrowRight strokeWidth={2.25} size={22} style="margin-bottom: -3px; margin-left: 3px;" />
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.main-container {
		display: flex;
		align-items: center;
		height: calc(100dvh - 120px);
		justify-content: center;
	}

	.creditNote {
		opacity: 0.75;
		padding: 50px;
		padding-top: 0px;
		padding-bottom: calc(var(--layout-margin) + var(--content-margin));
		text-align: center;
		font-size: 25px;
		max-width: 400px;
	}

	.buttonContainer {
		backdrop-filter: none;
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
		box-shadow: var(--box-shadow);
		margin-top: var(--box-margin);
	}

	.creditBox {
		width: 100%;
		margin-top: calc(-1 * var(--box-margin));
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.centerBox {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: calc(var(--layout-margin) + var(--content-margin));
	}

	.welcomeHeader {
		width: 100%;
		text-align: center;
		font-size: 75px;
		mask-size: 100% 100%;
		mask-repeat: no-repeat;
		padding-inline: calc(var(--layout-margin) * 2);
	}

	@media (max-width: 800px) {
		.welcomeHeader {
			font-size: 55px;
		}

		.creditNote {
			max-width: 300px;
		}
	}
</style>
