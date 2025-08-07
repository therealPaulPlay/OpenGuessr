<script>
	import { onMount } from "svelte";
	import { geoPath, geoMercator } from "d3-geo";
	import { feature } from "topojson-client";
	import { createEventDispatcher } from "svelte";

	let {
		region = "World",
		zoom = $bindable(1),
		width = 800,
		height = 250,
		center = {
			lat: 35,
			lon: 0,
		},
		interactive = true,
		notHighlightedColor = "rgba(125,125,125, 0.2)",
		locationList,
		onclick,
	} = $props();

	let mapContainer = $state();
	let features = $state([]);
	let points = $state([]); // New array to store point features

	let projection = geoMercator();
	let path = $state(geoPath().projection(projection));
	let regionCountries;

	let translateX = 0;
	let translateY = 0;

	const dispatch = createEventDispatcher();

	const MIN_ZOOM = 0.5;
	const MAX_ZOOM = 20;

	let loaded = $state(false);
	let rect;

	function handleRegionClick(svgElement, event) {
		rect = mapContainer.getBoundingClientRect();
		const x = (event.clientX - rect.left) * (width / rect.width);
		const y = (event.clientY - rect.top) * (height / rect.height);
		let [longitude, latitude] = projection.invert([x, y]);
		latitude = Math.round(latitude * 100) / 100;
		longitude = Math.round(longitude * 100) / 100;
		if (svgElement.isHighlighted) onclick?.(svgElement?.properties);
	}

	async function fetchTopoJSON() {
		try {
			const response = await fetch(`/json/topojson/topojson-world-110m.json`);
			const topology = await response.json();

			let featureData;
			const regionObjects = topology?.objects?.countries;

			// There must be some kind of object category
			if (topology && topology.objects && regionObjects) {
				featureData = feature(topology, regionObjects);
			}
			return featureData;
		} catch (error) {
			console.error("Error fetching topo json:", error);
		}
	}

	async function updateProjection() {
		// Calculate the scale based on the map container size and region zoom
		const minDimension = Math.min(width, height);
		const scale = (minDimension / 2) * zoom;

		projection.scale(scale).center([center.lon, center.lat]).translate([translateX, translateY]);
		path = geoPath().projection(projection);
	}

	function generatePaths() {
		const highlightedCountries = []; // Currently unused

		features = features
			.map((feature, index) => {
				const d = path(feature);
				if (d) {
					return {
						...feature,
						uniqueKey: `feature-${index}-${feature.properties.name || "unnamed"}`,
						d,
						isHighlighted: false,
						color: "var(--brand-color",
					};
				}
				return null;
			})
			.filter((feature) => feature);

		// Generate point features
		points = points.map((point, index) => {
			let [x, y] = projection([point.initX, point.initY]);
			return {
				...point,
				uniqueKey: `point-${index}`,
				x,
				y,
				isHighlighted: true,
				color: "var(--brand-color)",
			};
		});
	}

	// Drag & Zoom --------------------------------------------------------------------------------------------------------------------------
	let isDragging = false;
	let lastX, lastY;

	function handleZoom(event) {
		if (!interactive) return;
		event.preventDefault();

		rect = mapContainer.getBoundingClientRect();

		const cursorX = (event.clientX - rect.left) * (width / rect.width);
		const cursorY = (event.clientY - rect.top) * (height / rect.height);
		const direction = event.deltaY > 0 ? -1 : 1;
		const isTouchpad = Math.abs(event.deltaY) < 50;

		let zoomChange;
		if (isTouchpad) zoomChange = 1 + direction * 0.05;
		else zoomChange = Math.exp(direction * 0.1);

		const oldZoom = zoom;
		zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * zoomChange));
		const scaleChange = zoom / oldZoom;

		translateX -= (cursorX - translateX) * (scaleChange - 1);
		translateY -= (cursorY - translateY) * (scaleChange - 1);

		updateProjection();
		generatePaths();
	}

	function handleMouseDown(event) {
		if (!interactive) return;
		isDragging = true;
		lastX = event.clientX;
		lastY = event.clientY;
	}

	function handleMouseMove(event) {
		if (!interactive || !isDragging) return;
		// Store the initial rect for reference
		rect = mapContainer.getBoundingClientRect();
		translateX += (event.clientX - lastX) * (width / rect.width);
		translateY += (event.clientY - lastY) * (height / rect.height);
		lastX = event.clientX;
		lastY = event.clientY;
		updateProjection();
		generatePaths();
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Touch Drag and zoom ---------------------------------------------------------------------------------------------------------------------------
	let isTouching = false;
	let lastTouchDistance = null;

	function handleTouchStart(event) {
		if (!interactive) return;
		if (event.touches.length === 1) {
			isTouching = true;
			const touch = event.touches[0];
			lastX = touch.clientX;
			lastY = touch.clientY;
			lastTouchDistance = null;
		} else if (event.touches.length === 2) {
			isTouching = false; // Disable panning on multi-touch
			lastTouchDistance = getTouchDistance(event.touches);
		}
	}

	function handleTouchMove(event) {
		if (!interactive) return;

		if (isTouching && event.touches.length === 1) {
			event.preventDefault(); // Prevent page scroll
			rect = mapContainer.getBoundingClientRect();

			const touch = event.touches[0];
			const deltaX = touch.clientX - lastX;
			const deltaY = touch.clientY - lastY;

			translateX += deltaX * (width / rect.width);
			translateY += deltaY * (height / rect.height);

			lastX = touch.clientX;
			lastY = touch.clientY;

			updateProjection();
			generatePaths();
		} else if (event.touches.length === 2) {
			const currentDistance = getTouchDistance(event.touches);

			if (lastTouchDistance) {
				const distanceChange = currentDistance - lastTouchDistance;
				const zoomFactor = 1 + distanceChange / lastTouchDistance;

				// Calculate the pinch midpoint as the zoom focus point [of the two touches]
				const pinchMidX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
				const pinchMidY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

				// Get bounding rect for accurate translation calculation
				rect = mapContainer.getBoundingClientRect();
				const pinchMidXInMap = (pinchMidX - rect.left) * (width / rect.width);
				const pinchMidYInMap = (pinchMidY - rect.top) * (height / rect.height);

				// Apply zoom limit
				const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * zoomFactor));
				const scaleChange = newZoom / zoom; // Calculate scale factor change

				// Adjust translation to keep zoom centered on the pinch point
				translateX -= (pinchMidXInMap - translateX) * (scaleChange - 1);
				translateY -= (pinchMidYInMap - translateY) * (scaleChange - 1);

				zoom = newZoom; // Update the zoom level
				updateProjection();
				generatePaths();
			}

			lastTouchDistance = currentDistance;
		}
	}

	function handleTouchEnd(event) {
		isTouching = false;
		lastTouchDistance = null;
	}

	function getTouchDistance(touches) {
		if (!interactive) return;
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	onMount(() => {
		if (!interactive) return;
		mapContainer.addEventListener("touchstart", handleTouchStart);
		mapContainer.addEventListener("touchmove", handleTouchMove);
		mapContainer.addEventListener("touchend", handleTouchEnd);

		// Disable page zooming on touch gestures
		mapContainer.addEventListener("gesturestart", (e) => e.preventDefault());
		mapContainer.addEventListener("gesturechange", (e) => e.preventDefault());
		mapContainer.addEventListener("gestureend", (e) => e.preventDefault());

		return () => {
			mapContainer.removeEventListener("touchstart", handleTouchStart);
			mapContainer.removeEventListener("touchmove", handleTouchMove);
			mapContainer.removeEventListener("touchend", handleTouchEnd);
		};
	});

	// Mount, draw initial map  --------------------------------------------------------------------------------------------------------------------------
	onMount(async () => {
		const geoData = await fetchTopoJSON();

		if (geoData && locationList) {
			features = geoData.features; // Init features

			// Init points
			points = (locationList || []).map(([lat, lon], index) => {
				const [x, y] = projection([lon, lat]);
				const initX = lon;
				const initY = lat;
				return {
					type: "Point",
					uniqueKey: `point-${index}`,
					properties: { lat, lon },
					x,
					y,
					initX,
					initY,
					isHighlighted: true,
					color: "var(--brand-color)",
				};
			});

			translateX = width / 2;
			translateY = height / 2;
			updateProjection();
			generatePaths();
			loaded = true;
		}
	});
</script>

<div class="map-container" bind:this={mapContainer}>
	{#if !loaded}
		<div class="custom-loading-size">
			<p>Loading...</p>
		</div>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<svg
			width="100%"
			height="100%"
			viewBox={`0 0 ${width} ${height}`}
			onwheel={handleZoom}
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
			fill="white"
			class="position-relative {interactive ? 'pointer-events-auto' : 'pointer-events-none'}"
		>
			<g>
				<g>
					{#each features as feature (feature.uniqueKey)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<path
							d={feature.d}
							fill="var(--box-color)"
							stroke="rgba(255, 255, 255, 0.2)"
							stroke-width="0.5"
							vector-effect="non-scaling-stroke"
							onclick={(event) => handleRegionClick(feature, event)}
							onmouseenter={() => (feature.isHovered = true)}
							onmouseleave={() => (feature.isHovered = false)}
							class="feature-path"
						/>
					{/each}
				</g>

				<g>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					{#each points as point (point.uniqueKey)}
						<g
							onclick={(event) => handleRegionClick(point, event)}
							onmouseenter={() => (point.isHovered = true)}
							onmouseleave={() => (point.isHovered = false)}
							class="point-feature"
							stroke="var(--dark-background)"
							stroke-width="2"
							transform={`translate(${point.x},${point.y})`}
						>
							<circle
								r="7"
								fill={point.isHovered ? "white" : "var(--brand-color)"}
								class="point-circle"
								style="transition: fill 250ms ease; filter: brightness(0.75)"
							/>
						</g>
					{/each}
				</g>
			</g>
		</svg>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.map-container {
		box-shadow: var(--bulb-shadow);
		position: relative;
		overflow: hidden;
		height: 100%;
		width: 100%;
	}

	.position-relative {
		position: relative;
	}

	.custom-loading-size {
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		opacity: 0.5;
	}

	svg {
		display: block;
		cursor: pointer;
	}

	path:hover {
		color: oklch(var(--p));
	}

	.feature-path {
		transition:
			fill 0.1s ease,
			filter 0.1s ease;
	}

	.point-circle {
		transition:
			fill 0.1s ease,
			filter 0.1s ease;
	}
</style>
