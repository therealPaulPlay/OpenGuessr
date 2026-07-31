<script>
	const highlightedVideos = [
		"https://www.youtube.com/embed/lO96oaMSac8",
		"https://www.youtube.com/embed/0Q7bDmpX30U",
		"https://www.youtube.com/embed/nVBUlFgrvKM",
		"https://www.youtube.com/embed/HyC55tuu1zw",
	];
</script>

<svelte:head>
	<title>About</title>
</svelte:head>

<div class="text-container">
	<img alt="hero illustration with OpenGuessr mascot" src="/img/about_hero.jpg" class="hero-image" />
	<h1>About</h1>
	<p>
		If you're looking to read up on OpenGuessr, you've come to the right place! This page is for players curious about
		the project as well as journalists looking for a quick fact-sheet.
	</p>
	<br />
	<br />
	<h2>What is OpenGuessr?</h2>
	<p>
		OpenGuessr is a free geography game in which players see randomly selected panorama images and need to guess where
		they were taken. The browser game focuses on endless gameplay geared towards newcomers and casual players, but
		provides many modes and competitive features for those keen on trying more.
	</p>
	<br />
	<p>
		While the initial prototype for the game was developed in a single day in 2023, further development was halted until
		the site started to gain traction and reach millions of players in early 2024. Later that year, the site was
		completely overhauled and has been steadily updated since then.
	</p>
	<br />
	<br />
	<h2>OpenGuessr as a GeoGuessr alternative</h2>
	<p>
		OpenGuessr has a similar core gameplay loop to GeoGuessr and provides much of the same functionality, hence why it
		is commonly recommended as an alternative. Both games feature multiplayer lobbies (no account required in
		OpenGuessr!), ranked duels, tens of thousands of maps, leaderboards, a daily competition, tournaments, social
		features as well as sophisticated customization.
	</p>
	<br />
	<p>
		OpenGuessr also allows for player-created competitions and includes unique modes such as Country Guessr and Image
		Guessr, as well as interesting restrictions to make multiplayer more challenging (grayscale, blink mode..).
		GeoGuessr on the other hand has more sophisticated pro-player features such as detailed analytics, play-along
		functionality and the famous world cup.
	</p>
	<br />
	<p>
		As a mature alternative, the project has seen many UI revisions and players commonly highlight the polished look and
		fast UI feel. The interface features a variety of handcrafted illustrations, sound effects and animations which
		ensure the experience is interesting and consistent.
	</p>
	<br />
	<br />
	<h2>The "Open" in OpenGuessr</h2>
	<p>
		While the word "open" is often associated with Open Source, in the case of OpenGuessr it stands for the primary
		principle of the game: No feature should be restricted to paying users, every bit of functionality needs to be open
		to everyone.
	</p>
	<br />
	<p>
		Additionally, there should be as little friction as possible for players, hence why loading up the page immediately
		puts you into the geography-guessing action. No pop-ups or other annoyances, with an optional tutorial integrated
		into the core interface.
	</p>
	<br />
	<p>
		While the complete website isn't, parts of OpenGuessr are open-source, specifically the reusable chunks that other
		developers or players might find useful:
	</p>
	<br />
	<ul>
		<li>PlaySocketJS: The multiplayer library made for OpenGuessr.</li>
		<li>Headless-chat: The system that powers the built-in messenger.</li>
		<li>Fast-profanity-filter: This library ensures that player-created text is free of profane words.</li>
		<li>Overfade: The library enables smooth fade-in/out scroll transitions.</li>
		<li>Bugspot: The intelligent bug reporting system built for the game.</li>
		<li>OpenReport: The report and moderation system that keeps OpenGuessr fair.</li>
		<li>OpenGuessr Education: The educational offshoot of the game which includes articles and quizzes.</li>
	</ul>
	<br />
	<br />
	<h2>OpenGuessr in the media</h2>
	<p>
		The game has been enjoyed by creators from around the world and featured in articles and videos, which is really
		cool. To highlight a few:
	</p>
	<br />
	<div class="video-flex-container">
		{#each highlightedVideos as url}
			<iframe
				width="320"
				height="180"
				src={url}
				title="Featured video"
				frameborder="0"
				style:border-radius="var(--content-margin)"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				referrerpolicy="strict-origin-when-cross-origin"
				allowfullscreen
			></iframe>
		{/each}
	</div>
	<br />
	<br />
	<h2>Press kit</h2>
	<ul>
		<li><a href="/img/openguessr.svg" target="_blank">Logo</a></li>
		<li><a href="/img/android-chrome-512x512.png" target="_blank">Icon</a></li>
	</ul>

	<br />
	<br />
	<h2>More</h2>
	<p>
		Learn more about OpenGuessr on the
		<a href="https://paulplay.studio/openguessr" target="_blank">studio website</a>.
	</p>
</div>

<style>
	h1 {
		margin-bottom: var(--layout-margin);
	}

	h2 {
		margin-bottom: var(--box-margin);
	}

	.hero-image {
		width: 100%;
		aspect-ratio: 16/9;
		margin-bottom: var(--layout-spacer);
		border-radius: var(--layout-margin);
		filter: drop-shadow(var(--box-shadow));
	}

	.text-container {
		margin-inline: auto;
		margin-bottom: var(--layout-spacer);
		max-width: 900px;
		container-type: inline-size;
	}

	.video-flex-container {
		gap: var(--box-margin);
		display: grid;
		grid-template-columns: repeat(2, 320px);
		width: fit-content;
		max-width: 100%;
		border-radius: var(--layout-margin);
		padding: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
		overflow: hidden;
	}

	@container (max-width: 680px) {
		.video-flex-container {
			grid-template-columns: 320px;
		}
	}

	@media (max-width: 800px) and (orientation: portrait) {
		.hero-image {
			margin-bottom: calc(var(--layout-margin) + var(--box-margin));
			margin-top: var(--layout-margin);
		}
	}
</style>
