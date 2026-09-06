<script>
	import { onDestroy } from "svelte";
	import {
		currentLocationHeading,
		currentLocationPitch,
		currentLocationLatitude,
		currentLocationLongitude,
		currentLocationPanoramaId,
		customViewerLoad,
		panoramaSrc,
	} from "$lib/stores/locationStore";
	import { getPanoramaDataByCoords, getPanoramaDataById, getPanoramaTileUrl } from "$lib/utils/streetViewUrl";
	import { get } from "svelte/store";

	let { onload, onfail } = $props();

	let container = $state();
	let compassHeading = $state(0);
	let viewer;

	// Size constants
	const TILE = 512;
	const ZOOM = 4;
	const FOV = 90;
	const HAOV = 180;
	const VAOV = 120;

	const wrap = (value, range) => ((value % range) + range) % range;

	const loadTile = (id, x, y, drawX, drawY) =>
		new Promise((resolve) => {
			const img = new Image();
			img.crossOrigin = "anonymous"; // Keeps the canvas untainted so it can be exported
			img.onload = () => resolve({ img, drawX, drawY });
			img.onerror = () => resolve(null);
			img.src = getPanoramaTileUrl(id, x, y, ZOOM);
		});

	async function showPanorama(lat, lon, panoramaId) {
		const src = $panoramaSrc;
		const didPanoramaChange = () => $panoramaSrc !== src;

		// Like the Street View API we fall back to the coordinate method when the panorama ID fails
		const pano =
			(panoramaId && (await getPanoramaDataById(panoramaId, ZOOM))) || (await getPanoramaDataByCoords(lat, lon, ZOOM));
		if (didPanoramaChange()) return;
		if (!pano) return onfail?.(); // No coverage, let iFrame handle this

		const heading = $currentLocationHeading ?? pano.heading;
		const pitch = $currentLocationPitch ?? 0;

		// The image centre sits at the panorama's own bearing, so offset from there to find the column we want to face
		const centre = wrap(pano.width / 2 + ((heading - pano.heading) / 360) * pano.width, pano.width);
		const cropWidth = Math.round((pano.width * HAOV) / 360);
		const cropHeight = Math.round((pano.height * VAOV) / 180);
		const left = Math.round(centre - cropWidth / 2);

		// Centre rows on the pitch, clamped as there is nothing above the poles
		const centreRow = pano.height / 2 - (pitch / 180) * pano.height;
		const top = Math.min(Math.max(0, Math.round(centreRow - cropHeight / 2)), pano.height - cropHeight);
		const vOffset = ((pano.height / 2 - (top + cropHeight / 2)) / pano.height) * 180; // Clamping moves it, so read it back

		// At this zoom the width is an exact multiple of the tile size, so columns wrap cleanly with no overscan
		const columns = pano.width / TILE;
		const rows = Math.ceil(pano.height / TILE);

		// Build array of pending image tile requests
		const pending = [];
		for (
			let y = Math.max(0, Math.floor(top / TILE));
			y <= Math.min(rows - 1, Math.floor((top + cropHeight - 1) / TILE));
			y++
		) {
			for (let x = Math.floor(left / TILE); x <= Math.floor((left + cropWidth - 1) / TILE); x++) {
				pending.push(loadTile(pano.id, wrap(x, columns), y, x * TILE - left, y * TILE - top));
			}
		}

		// Wait for all to load, filter for presence
		const tiles = (await Promise.all(pending)).filter(Boolean);
		if (didPanoramaChange()) return;
		if (!tiles.length) return onfail?.();

		const canvas = Object.assign(document.createElement("canvas"), { width: cropWidth, height: cropHeight });
		const context = canvas.getContext("2d");
		for (const tile of tiles) context.drawImage(tile.img, tile.drawX, tile.drawY);

		// Free the canvas element once exported (it would get garbage collected anyway, but size resets its bitmap site immediately)
		const panorama = canvas.toDataURL("image/jpeg", 0.92);
		canvas.width = canvas.height = 0;

		// The embed's field of view is vertical, Pannellum's is horizontal, so it needs to be adjusted
		const aspect = (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight);
		const hfov = (2 * Math.atan(Math.tan((FOV * Math.PI) / 360) * aspect) * 180) / Math.PI;

		try {
			// Browser-only lazy import for Pannellum
			await Promise.all([import("pannellum/build/pannellum.js"), import("pannellum/build/pannellum.css")]);
			if (didPanoramaChange()) return;

			viewer?.destroy();
			viewer = window.pannellum.viewer(container, {
				type: "equirectangular",
				panorama,
				haov: HAOV,
				vaov: VAOV,
				vOffset,
				yaw: 0,
				pitch,
				hfov,
				minHfov: hfov,
				maxHfov: hfov,
				autoLoad: true,
				showControls: false,
				draggable: false,
				mouseZoom: false,
				disableKeyboardCtrl: true,
			});

			compassHeading += wrap(heading - compassHeading + 180, 360) - 180; // Keeps the needle turning the short way round
			onload?.();
		} catch (error) {
			console.error("Error loading pannellum viewer:", error);
		}
	}

	// Assign load / refresh function
	customViewerLoad.set(() =>
		showPanorama($currentLocationLatitude, $currentLocationLongitude, $currentLocationPanoramaId),
	);

	$effect(() => {
		$panoramaSrc; // Re-run when the required panorama changes
		get(customViewerLoad)?.();
	});

	onDestroy(() => {
		viewer?.destroy();
		customViewerLoad.set(null);
	});
</script>

<div id="custom-panorama" bind:this={container}></div>

<div class="panorama-compass">
	<svg class="compass-background" viewBox="0 0 100 100">
		<circle cx="50" cy="50" r="50" fill="#222222" />
		<circle cx="50" cy="50" r="22" fill="#595959" />
	</svg>
	<svg class="compass-turn" viewBox="0 0 30 100">
		<path
			fill="#b3b3b3"
			d="m24.84 69.76-.84-11.76-4.28 2.34C18.61 57.09 18 53.62 18 50c0-6.17 1.75-11.93 4.78-16.82l-2.5-1.66C16.94 36.88 15 43.21 15 50c0 4.14.72 8.11 2.04 11.79L13 64l7.7 5.13L25 72z"
		/>
	</svg>
	<svg class="compass-turn compass-turn-opposite" viewBox="0 0 30 100">
		<path
			fill="#b3b3b3"
			d="m24.84 69.76-.84-11.76-4.28 2.34C18.61 57.09 18 53.62 18 50c0-6.17 1.75-11.93 4.78-16.82l-2.5-1.66C16.94 36.88 15 43.21 15 50c0 4.14.72 8.11 2.04 11.79L13 64l7.7 5.13L25 72z"
		/>
	</svg>
	<svg class="compass-needle" viewBox="0 0 40 100" style:rotate={-compassHeading + "deg"}>
		<path fill="#c1272d" d="m10 50 10-32 10 32z" />
		<path fill="#d1d1d1" d="M30 50 20 82 10 50z" />
	</svg>
</div>

<style>
	#custom-panorama {
		background-color: var(--panorama-background);
		position: fixed;
		inset: 0;
		z-index: 0;
	}

	.panorama-compass {
		position: fixed;
		right: 10px;
		bottom: 137px;
		width: 48px;
		height: 48px;
		z-index: 1;
		user-select: none;
	}

	.panorama-compass svg {
		position: absolute;
		top: 0;
		height: 48px;
	}

	.compass-background {
		left: 0;
		width: 48px;
	}

	.compass-turn {
		left: 0;
		width: 14px;
	}

	.compass-turn-opposite {
		transform: scaleX(-1);
		transform-origin: 24px 0;
	}

	.compass-needle {
		left: 14px;
		width: 20px;
		transition: rotate 400ms ease-out;
	}
</style>
