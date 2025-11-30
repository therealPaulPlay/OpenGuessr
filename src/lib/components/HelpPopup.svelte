<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { helpPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
	import { Search, Goal, Users } from "@lucide/svelte";

	let currentSlide = $state(0);

	const slides = [
		{
			icon: Search,
			title: "Look at the panorama",
			description: "Explore its surroundings and study all clues.",
			image: "/img/help_image_1.jpg", // Replace with actual image path
		},
		{
			icon: Goal,
			title: "Guess where you are",
			description: "Pinpoint the location precisely for a higher score.",
			image: "/img/help_image_2.jpg", // Replace with actual image path
		},
		{
			icon: Users,
			title: "Challenge your friends",
			description: "Compete against friends in multiplayer modes.",
			image: "/img/help_image_3.jpg", // Replace with actual image path
		},
	];

	function handleNext() {
		playSound("basic_button");
		if (currentSlide < slides.length - 1) {
			currentSlide++;
		} else {
			helpPopup.set(false);
		}
	}

	helpPopup.subscribe((value) => {
		if (value) {
			currentSlide = 0;
		}
	});

	let CurrentIcon = $derived(slides[currentSlide].icon);
</script>

<Popup verySlim={true} bind:open={$helpPopup}>
	<div class="popup-title">
		<h1>How to play</h1>
	</div>

	<div class="flexSlideTitle">
		{#if CurrentIcon}
			<CurrentIcon strokeWidth={2.25} />
		{/if}
		<h3 class="slide-title">
			{slides[currentSlide].title}
		</h3>
	</div>

	<p class="slide-description">
		{slides[currentSlide].description}
	</p>

	<div class="image-container">
		<img src={slides[currentSlide].image} alt={slides[currentSlide].title} class="slide-image" />
		<div class="indicator-container">
			{#each slides as _, i}
				<div class="indicator-dot" class:active={i === currentSlide}></div>
			{/each}
		</div>
	</div>

	<button class="standardButton largeButton white" onclick={handleNext}>
		{`${currentSlide != 2 ? "Continue" : "Let's go!"}`}
	</button>
</Popup>

<style>
	.image-container {
		overflow: hidden;
		box-sizing: border-box;
		border-radius: var(--box-margin);
		margin-bottom: 10px;
		position: relative;
	}

	.slide-description {
		margin-left: 35px;
		opacity: 0.75;
		margin-bottom: var(--layout-margin);
	}

	.slide-image {
		width: 100%;
		height: auto;
		display: block;
		object-fit: cover;
	}

	.flexSlideTitle {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: var(--layout-margin);
	}

	.indicator-container {
		display: flex;
		box-shadow: var(--bulb-shadow);
		gap: 0.5rem;
		position: absolute;
		bottom: 15px;
		left: 15px;
		background-color: var(--panel-color);
		padding: 5px;
		border-radius: 5px;
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
</style>
