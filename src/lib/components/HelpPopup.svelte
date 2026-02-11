<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { helpPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { Goal, Users, ArrowLeft, ArrowRight, ScanSearch } from "@lucide/svelte";

	let currentSlide = $state(0);

	const slides = [
		{
			icon: ScanSearch,
			title: "1. Look at the panorama",
			description: "Explore its surroundings and study all clues.",
			image: "/img/help_image_1.jpg", // Replace with actual image path
		},
		{
			icon: Goal,
			title: "2. Guess where you are",
			description: "Pinpoint the location precisely for a higher score.",
			image: "/img/help_image_2.jpg", // Replace with actual image path
		},
		{
			icon: Users,
			title: "3. Challenge your friends",
			description: "Compete against friends in multiplayer modes.",
			image: "/img/help_image_3.jpg", // Replace with actual image path
		},
	];

	function handleNext() {
		playSound("basic_button");
		if (currentSlide < slides.length - 1) currentSlide++;
		else helpPopup.set(false);
	}

	function handlePrevious() {
		playSound("basic_button");
		if (currentSlide > 0) currentSlide--;
	}

	helpPopup.subscribe((value) => {
		if (value) currentSlide = 0;
	});

	let CurrentIcon = $derived(slides[currentSlide].icon);
</script>

<Popup verySlim={true} bind:open={$helpPopup}>
	<div class="popup-title">
		<h1>How to play</h1>
	</div>

	<div class="text-box">
		<div class="flex-slide-title">
			<p class="slide-title">
				{slides[currentSlide].title}
			</p>
		</div>

		<p class="slide-description">
			{slides[currentSlide].description}
		</p>
		{#if CurrentIcon}
			<span class="current-icon">
				<CurrentIcon strokeWidth={1.75} size={90} />
			</span>
		{/if}
	</div>

	<div class="image-container">
		<img src={slides[currentSlide].image} alt={slides[currentSlide].title} class="slide-image" />
		<div class="indicator-container">
			{#each slides as _, i}
				<div class="indicator-dot" class:active={i === currentSlide}></div>
			{/each}
		</div>
	</div>
	<div class="button-box">
		<button class="standardButton white largeButton" onclick={handlePrevious} disabled={currentSlide == 0}>
			<ArrowLeft size={22} strokeWidth={2.25} style="margin-bottom: -3px;" />
		</button>
		<button class="standardButton white largeButton" onclick={handleNext}>
			{`${currentSlide != 2 ? "Next" : "Let's go!"}`}
			{#if currentSlide != 2}
				<ArrowRight size={22} strokeWidth={2.25} style="margin-bottom: -3px;" />
			{/if}
		</button>
	</div>
</Popup>

<style>
	.image-container {
		overflow: hidden;
		box-sizing: border-box;
		border-radius: var(--box-margin);
		position: relative;
	}

	.slide-description {
		opacity: 0.75;
	}

	.button-box {
		margin-top: var(--layout-margin);
		display: flex;
		gap: var(--layout-margin);
		justify-content: right;
		width: 100%;
	}

	.slide-image {
		width: 100%;
		height: auto;
		display: block;
		object-fit: cover;
	}

	.flex-slide-title {
		display: flex;
		align-items: center;
		gap: var(--box-margin);
	}

	.indicator-container {
		display: flex;
		box-shadow: var(--bulb-shadow);
		gap: 0.5rem;
		position: absolute;
		bottom: var(--layout-margin);
		left: var(--layout-margin);
		background-color: var(--panel-color);
		padding: var(--content-margin);
		border-radius: var(--content-margin);
		backdrop-filter: blur(10px);
	}

	.indicator-dot {
		width: 0.5rem;
		height: 0.5rem;
		background-color: rgba(255, 255, 255, 0.25);
		border-radius: 50%;
		transition: background-color 0.3s ease;
	}

	.indicator-dot.active {
		background-color: white;
	}

	.text-box {
		display: flex;
		flex-direction: column;
		padding: var(--box-margin);
		padding-bottom: var(--layout-margin);
		padding-inline: var(--layout-margin);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
		margin-bottom: var(--layout-margin);
		position: relative;
		overflow: hidden;
	}

	.current-icon {
		opacity: 0.05;
		rotate: 5deg;
		top: var(--content-margin);
		right: 20px;
		position: absolute;
	}
</style>
