<script>
	import { ChevronDown, X } from "@lucide/svelte";
	import MapCard from "$lib/components/MapCard.svelte";
	import MoreMapsVisualization from "$lib/components/MoreMapsVisualization.svelte";
	import {
		apiUrl,
		appStoreUrl,
		discordInviteUrl,
		educationUrl,
		gitHubUrl,
		playStoreUrl,
		redditUrl,
		youTubeUrl,
	} from "$lib/stores/context-specific/apiConfigStore";
	import { faq } from "$lib/stores/context-specific/faqStore";

	let { hidden = false } = $props();

	// Spotlight maps
	let highlightedMaps = $state([]);
	let loadingText = $state("Loading...");

	async function fetchSpotlightMaps() {
		try {
			const response = await fetch($apiUrl + "/maps/favourites");
			if (!response.ok) throw new Error(response.status);
			highlightedMaps = (await response.json())?.communityMaps;
		} catch (error) {
			loadingText = "Error loading maps.";
			console.error("Failed to load spotlight maps for the about article:", error);
		}
	}

	$effect(() => {
		if (!hidden && !highlightedMaps?.length) fetchSpotlightMaps();
	});
</script>

<article class="text-container" {hidden}>
	<img alt="hero illustration with OpenGuessr mascot" src="/img/about_hero.jpg" class="hero-image" loading="lazy" />
	<h1>About OpenGuessr</h1>
	<p>
		An exciting geography journey is ahead of you. With OpenGuessr, you can travel the world without paying a dime.
		Based on real Street View, immerse yourself in a completely unlimited & free geography-guessing game. No account is
		required.
	</p>
	<section>
		<h2>History</h2>
		<p>
			While the initial prototype for the game was developed in a single day in 2023, further development ramped up as
			the site started to gain traction and reach millions of players in early 2024. Later that year, the site was
			completely overhauled and has been steadily updated since then.
		</p>
	</section>

	<section>
		<h2>The core loop</h2>
		<div class="figures">
			<figure>
				<img
					src="/img/tutorial/help_image_1.jpg"
					alt="A Street View panorama with road markings and a sign highlighted as clues"
					width="1920"
					height="1080"
					loading="lazy"
				/>
				<figcaption>Inspect the panorama image for clues.</figcaption>
			</figure>
			<figure>
				<img
					src="/img/tutorial/help_image_2.jpg"
					alt="A world map with a guess pin, the actual location flag and a line between them"
					width="1920"
					height="1080"
					loading="lazy"
				/>
				<figcaption>Pinpoint the location on the map and reveal the result.</figcaption>
			</figure>
		</div>
		<p>
			View and explore the interactive panorama, guess where you are, and lock in your guess when you're confident to
			reveal the answer. OpenGuessr is the free geography-guessing experience that you've been searching for.
		</p>
	</section>

	<section>
		<h2>Game modes</h2>
		<p>
			Enjoy endless singleplayer, team up with friends even without an account, get competitive in division duels, and
			enter competitions or create your own.
		</p>
		{const modes = [
			[
				"Singleplayer",
				"Play endlessly at your own pace. Try a timer or switch on NMPZ with no road labels displayed.",
				"singleplayer_illustration",
			],
			[
				"Multiplayer",
				"Play with friends in custom lobbies with no account, or try duels, 2v2, and tournaments.",
				"multiplayer_illustration",
			],
			[
				"Competitions",
				"Enter the daily competition, explore hundreds of player-made ones, or create your own.",
				"competitions_illustration",
			],
		]}
		<div class="card-grid">
			{#each modes as [name, text, illustration]}
				<div class="card">
					<div class="card-image illustration">
						<img src="/img/about/{illustration}.png" alt="{name} illustration" loading="lazy" />
					</div>
					<h3>{name}</h3>
					<p>{text}</p>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2>Maps</h2>
		<p>
			If you prefer exploring in Singleplayer, tens of thousands of maps, an automatically regenerated World map, and a
			built-in blink mode are waiting for you. Set a timer, or play at your own pace. If you're a beginner, give Country
			Guessr and Meta Guessr a try to make learning feel effortless.
		</p>
		{const maps = [
			["World", "An always fresh map of the world.", "world_cover"],
			["Country Guessr", "Guess the country.", "country_guessr_cover"],
			["Meta Guessr", "Learn metas through play.", "meta_guessr_cover"],
			["Image Guessr", "Guess based on photos.", "image_guessr_cover"],
		]}
		<div class="card-grid map-grid">
			{#each maps as [name, text, cover]}
				<div class="card">
					<img
						class="card-image"
						src="/img/map-covers/{cover}.jpg"
						alt="{name} cover"
						width="640"
						height="427"
						loading="lazy"
					/>
					<h3>{name}</h3>
					<p>{text}</p>
				</div>
			{/each}
			<div class="card">
				<div class="card-image">
					{#if !hidden}
						<MoreMapsVisualization plus={false} />
					{/if}
				</div>
				<h3>And more</h3>
				<p>Explore over 30k community maps.</p>
			</div>
		</div>
	</section>

	<section>
		<h2>OpenGuessr as a GeoGuessr alternative</h2>
		<p>
			OpenGuessr has a similar core gameplay loop to GeoGuessr and provides much of the same functionality, hence why it
			is commonly recommended as a free alternative. Both games feature multiplayer lobbies, ranked division duels, tens
			of thousands of maps, leaderboards, a daily competition, tournaments, social features including a messenger as
			well as sophisticated customization.
		</p>
		<p>
			OpenGuessr also allows for player-created competitions and includes unique modes such as Country Guessr and Image
			Guessr, as well as interesting restrictions to make multiplayer more challenging (grayscale, blink mode...).
			GeoGuessr on the other hand has more sophisticated pro-player features such as detailed analytics, play-along
			functionality and the famous world cup.
		</p>
		{const comparison = [
			["Price", "Entirely free", "Unlimited is 48€ a year (as of late 2026)"],
			["Round limit", "None", "Daily challenge only"],
			["Account needed", "No", "Yes"],
			["Multiplayer", "Custom rooms, division duels, 2v2", "Parties, duels, team duels"],
			["Community maps", "Tens of thousands", "Largest catalogue"],
			["Competitions", "Daily and player-made competitions, tournaments", "Daily challenge, official events"],
			["Source code", "Fully source-available", "Private"],
		]}
		<div class="table-container">
			<table>
				<thead>
					<tr><td></td><th scope="col">OpenGuessr</th><th scope="col">GeoGuessr</th></tr>
				</thead>
				<tbody>
					{#each comparison as [feature, openGuessr, geoGuessr]}
						<tr>
							<th scope="row">{feature}</th>
							<td data-label="OpenGuessr">{openGuessr}</td>
							<td data-label="GeoGuessr">{geoGuessr}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p style:opacity="0.5">
			For more in-depth comparisons, check out
			<a href="https://geometas.com/learn/geoguessr_vs_openguessr" target="_blank">GeoGuessr vs. OpenGuessr</a>,
			<a href="https://geometas.com/learn/openguessr_vs_worldguessr" target="_blank">OpenGuessr vs. WorldGuessr</a>
			and
			<a href="https://geometas.com/learn/openguessr_vs_geotastic" target="_blank">OpenGuessr vs. Geotastic</a>.
		</p>
	</section>

	<section>
		<h2>The "Open" in OpenGuessr</h2>
		<p>
			While the word "open" is often associated with Open Source, in the case of OpenGuessr it stands for the primary
			principle of the game: No feature should be restricted to paying users, every bit of functionality needs to be
			open to everyone. The game is funded by supporter perks that grant cosmetics, boosts that also apply to whoever
			you are playing with, and ad-free.
		</p>
		<p>
			Additionally, there should be as little friction as possible for players, hence why loading up the page
			immediately preloads the first location enabling you to get into the geography-guessing action right away. No
			pop-ups or other annoyances, with an optional tutorial available.
		</p>
	</section>

	<section>
		<h2>Multiplayer</h2>
		<p>
			OpenGuessr's multiplayer is in its third generation, powered by an open-source in-house library called PlaySocket.
			This system applies optimistic updates automatically in order to make the experience the smoothest and snappiest
			in the industry. Reconnects are performed automatically within a grace period, and through storage synchronization
			players can join at any point.
		</p>
	</section>

	<section>
		<h2>Community maps</h2>
		<p>
			Thanks to the vibrant community, there are countless high-quality maps. Ones that players love accumulate likes
			and move up the ranks. You can browse all maps <a href="/maps">here</a>, or check out these examples from the
			spotlight.
		</p>
		<div class="map-container">
			{#if highlightedMaps?.length}
				{#each highlightedMaps.slice(0, 3) as map}
					<MapCard {map} />
				{/each}
			{:else}
				<p class="loading-text">{loadingText}</p>
			{/if}
		</div>
	</section>

	<section>
		<h2>Progress and customization</h2>
		<p>
			The closer your guess, the more experience you earn from it. When you get the country right multiple times in a
			row, that's called a country streak. Through streaks, gained experience, and other achievements, you unlock
			special pins and badges. The
			<a href="/leaderboard">leaderboard</a> ranks players by Elo and XP, and tokens from duels allow players to
			purchase pins in the <a href="/shop">shop</a>.
		</p>
	</section>

	<section>
		<h2>Platforms and source code</h2>
		<p>
			OpenGuessr runs in any modern browser, and there are native apps for
			<a href={$playStoreUrl} target="_blank">Android</a>
			and <a href={$appStoreUrl} target="_blank">iOS</a> that support the same set of features as the web version.
		</p>
		<p>
			While the core website isn't open source, it is source-available and the source code can be found
			<a href={$gitHubUrl} target="_blank">here on GitHub</a>. There are a few open-source parts of the game, these are
			reusable libraries that other developers might find useful:
		</p>
		<ul>
			<li>PlaySocketJS: The multiplayer library made for OpenGuessr.</li>
			<li>headless-chat: The system that powers the built-in messenger.</li>
			<li>fast-profanity-filter: This library ensures that player-created text is free of profane words.</li>
			<li>overfade: This library enables smooth fade-in/out scroll transitions.</li>
			<li>Bugspot: The intelligent bug reporting system built for the game.</li>
			<li>OpenReport: The report and moderation system that keeps OpenGuessr fair.</li>
			<li>OpenGuessr Education: The educational offshoot of the game which includes articles and quizzes.</li>
		</ul>
	</section>

	<section>
		<h2>Community and learning</h2>
		<p>
			Join the community on <a href={$discordInviteUrl} target="_blank">Discord</a> and
			<a href={$redditUrl} target="_blank">Reddit</a>, or watch the latest videos on
			<a href={$youTubeUrl} target="_blank">YouTube</a>.
			<a href={$educationUrl} target="_blank">OpenGuessr Education</a> takes you from beginner all the way to pro, and
			with <a href="https://geometas.com" target="_blank">Geometas</a> you can level-up your knowledge of GeoGuessr metas.
		</p>
	</section>

	<section>
		<h2>Common questions</h2>
		<div>
			{#each $faq as { question, answer }}
				<details>
					<summary>
						<h3>{question}</h3>
						<span class="faq-icon">
							<ChevronDown class="faq-chevron" size={22} strokeWidth={2.25} />
							<X class="faq-close" size={22} strokeWidth={2.25} />
						</span>
					</summary>
					<p>{answer}</p>
				</details>
			{/each}
		</div>
	</section>

	<section>
		<h2>OpenGuessr in the media</h2>
		<p>
			The game has been enjoyed by creators from around the world and featured in articles and videos, which is really
			cool. Here are some highlights.
		</p>
		{const highlightedVideos = [
			"https://www.youtube.com/embed/lO96oaMSac8",
			"https://www.youtube.com/embed/0Q7bDmpX30U",
			"https://www.youtube.com/embed/nVBUlFgrvKM",
			"https://www.youtube.com/embed/HyC55tuu1zw",
		]}
		<div class="video-container">
			{#if !hidden}
				{#each highlightedVideos as url, i}
					<iframe
						src={url}
						title="Featured video {i + 1}"
						loading="lazy"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						referrerpolicy="strict-origin-when-cross-origin"
						allowfullscreen
					></iframe>
				{/each}
			{/if}
		</div>
	</section>

	<section>
		<h2>Press kit</h2>
		<ul>
			<li><a href="/img/openguessr.svg" target="_blank">Logo</a></li>
			<li><a href="/img/android-chrome-512x512.png" target="_blank">Icon</a></li>
		</ul>
	</section>

	<section>
		<h2>More</h2>
		<p>
			Learn more about OpenGuessr on the
			<a href="https://paulplay.studio/openguessr" target="_blank">PaulPlay Studio website</a>, or get started with
			OpenGuessr in your language: <a href="/get-started/en">English</a>, <a href="/get-started/de">German</a>,
			<a href="/get-started/es">Spanish</a>, <a href="/get-started/fr">French</a>,
			<a href="/get-started/id">Indonesian</a>, <a href="/get-started/pt">Portuguese</a> or
			<a href="/get-started/jp">Japanese</a>.
		</p>
	</section>
</article>

<style>
	.text-container {
		max-width: 900px;
		margin-inline: auto;
		margin-bottom: var(--layout-spacer);
	}

	.hero-image {
		width: 100%;
		height: auto;
		aspect-ratio: 16/9;
		margin-bottom: var(--layout-spacer);
		border-radius: var(--layout-margin);
		user-select: none;
		pointer-events: none;
	}

	h1 {
		margin-bottom: var(--layout-margin);
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--layout-margin);
		margin-top: var(--layout-spacer);
	}

	.figures {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--layout-margin);
		margin-bottom: var(--box-margin);
	}

	.figures img {
		width: 100%;
		height: auto;
		border-radius: var(--layout-margin);
		user-select: none;
		pointer-events: none;
	}

	figcaption {
		margin-top: var(--content-margin);
		padding-inline: var(--content-margin);
		color: white;
		font-size: 22px;
		opacity: 0.5;
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: var(--layout-margin);
		margin-block: var(--box-margin);
	}

	.map-grid {
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	}

	.card {
		padding: var(--box-margin);
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
		color: white;
	}

	.card-image {
		display: block;
		width: 100%;
		height: 130px;
		margin-bottom: var(--box-margin);
		border-radius: var(--panel-margin);
		object-fit: cover;
		user-select: none;
		pointer-events: none;
	}

	.illustration {
		background-color: var(--box-color-dark);
		padding-block: var(--layout-margin);
		height: 150px;
	}

	.illustration img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		scale: 1.3;
	}

	.card h3 {
		margin-bottom: var(--content-margin);
		padding-inline: var(--content-margin);
	}

	.card p {
		opacity: 0.75;
		padding-inline: var(--content-margin);
		padding-bottom: var(--content-margin);
	}

	@media (max-width: 600px) {
		.card-grid,
		.map-grid {
			grid-template-columns: 1fr;
		}

		.card {
			display: grid;
			grid-template-columns: 40% 1fr;
			grid-template-rows: auto 1fr;
			column-gap: var(--box-margin);
		}

		.card-image {
			grid-row: 1 / 3;
			height: 100%;
			min-height: 90px;
			margin-bottom: 0;
		}
	}

	.table-container {
		padding: var(--box-margin);
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
		margin-block: var(--box-margin);
	}

	table,
	thead {
		display: block;
		color: white;
		font-size: 22px;
	}

	tbody {
		display: flex;
		flex-direction: column;
		gap: var(--box-margin);
	}

	tr {
		display: grid;
		grid-template-columns: 1fr 2fr 2fr;
		column-gap: var(--box-margin);
		padding: var(--box-margin);
	}

	th,
	td {
		padding-inline: var(--content-margin);
	}

	th {
		text-align: left;
		font-weight: 400;
	}

	thead th {
		font-size: 22px;
	}

	tbody th {
		opacity: 0.5;
	}

	tbody tr {
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		box-shadow: var(--box-shadow);
	}

	@media (max-width: 600px) {
		thead {
			display: none;
		}

		tbody tr {
			grid-template-columns: 1fr 1fr;
			row-gap: var(--content-margin);
		}

		tbody th {
			grid-column: 1 / -1;
			display: flex;
			align-items: center;
			gap: var(--layout-margin);
		}

		tbody th::after {
			content: "";
			flex-grow: 1;
			height: 2px;
			margin-top: var(--content-margin);
			border-radius: var(--content-margin);
			background-color: var(--line-color);
		}

		td::before {
			content: attr(data-label);
			display: block;
			margin-bottom: var(--content-margin);
			font-size: 20px;
			opacity: 0.5;
		}
	}

	.video-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--box-margin);
		padding: var(--box-margin);
		border-radius: var(--layout-margin);
		background-color: var(--box-color);
		box-shadow: var(--panel-shadow);
	}

	.video-container iframe {
		width: 100%;
		aspect-ratio: 16/9;
		border-radius: var(--box-margin);
	}

	.map-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--layout-margin);
		margin-block: var(--box-margin);
	}

	.loading-text {
		opacity: 0.5;
		grid-column: 1 / -1;
	}

	details {
		border-bottom: 2px solid var(--line-color);
	}

	details:first-child {
		border-top: 2px solid var(--line-color);
	}

	summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--layout-margin);
		padding-block: var(--layout-margin);
		cursor: pointer;
		list-style: none;
	}

	.faq-icon {
		position: relative;
		flex-shrink: 0;
		width: 22px;
		height: 22px;
		opacity: 0.5;
	}

	.faq-icon :global(svg) {
		position: absolute;
		inset: 0;
		transition:
			scale 250ms ease,
			opacity 250ms ease;
	}

	details:not([open]) :global(.faq-close),
	details[open] :global(.faq-chevron) {
		scale: 0;
		opacity: 0;
	}

	details p {
		padding-bottom: var(--layout-margin);
		opacity: 0.75;
	}
</style>
