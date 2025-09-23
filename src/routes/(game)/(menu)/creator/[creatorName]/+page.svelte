<script>
	import { blur, fly } from "svelte/transition";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { ArrowRight } from "lucide-svelte";
	import { page } from "$app/stores";
	import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";

	let creator = $state("No creator");

	$effect(() => {
		creator = $page.params?.creatorName || "No creator";
	});

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

<div class="main-container">
	{#if mounted}
		<div class="centerBox">
			<h1 class="welcomeHeader" in:fly={{ y: -20, duration: 1000 }}>Applause for {creator}!</h1>
			<div class="creditBox">
				<p class="creditNote" in:blur={{ duration: 500 }}>Now, let's kick off your geography journey.</p>
			</div>
			<button
				class="standardButton playButton flexButton"
				in:fly={{ y: 20, duration: 1000 }}
				onclick={() => {
					goto("/");
				}}
			>
				Let's go
				<div class="arrowIconContainer"><ArrowRight strokeWidth={3} /></div>
			</button>
		</div>
	{/if}
</div>

<style>
	.main-container {
		display: flex;
		align-items: center;
		min-height: 80dvh;
		justify-content: center;
	}

	.creditNote {
		opacity: 0.65;
		padding: 50px;
		padding-top: 0px;
		padding-bottom: 20px;
		text-align: center;
		font-size: 25px;
		max-width: 400px;
	}

	.creditBox {
		width: 100%;
		margin-top: -15px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.flexButton {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
	}

	.arrowIconContainer {
		margin-top: 6px;
	}

	.centerBox {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 20px;
	}

	.welcomeHeader {
		width: 100%;
		text-align: center;
		font-size: 75px;
		mask-image: linear-gradient(to bottom, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.6) 100%);
		mask-size: 100% 100%;
		mask-repeat: no-repeat;
		padding-inline: 30px;
	}

	.playButton {
		border-radius: var(--box-margin);
		min-height: 50px;
		padding-inline: 15px;
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
