<script>
	import GetStarted from "$lib/components/GetStarted.svelte";
</script>

<svelte:head>
	<title>Start playing GeoGuessr for free</title>
</svelte:head>

<GetStarted
	imgName="get_started_english.jpg"
	ctaTitle="It's time to get started."
	ctaButton="Play now"
	content={[
		{
			heading: "The free GeoGuessr alternative.",
			paragraph: `An exciting geography journey is ahead of you. With OpenGuessr, you can travel the world without paying a dime.
		Based on real Street View, immerse yourself in the largest, completely unlimited & free geography-guessing game. No
		account is required.`,
		},
		{
			heading: "No paywalls, anywhere.",
			paragraph: `"Open" is part of the name for a reason — no mode, feature, or gameplay aspect is locked behind a paywall,
		everything is open for you to explore. Funded by supporter perks that grant cosmetics, slight boosts and ad-free.`,
		},
		{
			heading: "Maps you might like.",
			paragraph: `Start a game directly on a map of your choice. Here, we have picked a few that might suit you and your language.
		These contain locations from Times Square to Sydney Opera house, ready to jump into one?`,
		},
		{
			heading: "The best way to play for free.",
			paragraph: `View the panorama, place the pin, and lock in your guess to reveal where you are — OpenGuessr is the free
		geography-guessing experience that you've been searching for. Team up with friends in multiplayer, get competitive
		with duels, or see how you stack up against others in competitions.`,
			paragraph2: `If you prefer exploring in Singleplayer, tens of thousands of maps, an automatically regenerated World map, and a
		built-in blink mode are waiting for you. Set a timer, or play at your own pace. For beginners, Country Guessr and
		Meta Guessr help you advance fast, and OpenGuessr Education provides you with pro-player knowledge at your
		fingertips.`,
		},
	]}
	maps={["Equalized USA", "Sydney, Australia", "London, UK"]}
/>
