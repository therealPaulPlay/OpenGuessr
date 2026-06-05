<script>
	import { onMount } from "svelte";
	import { geoPath, geoMercator } from "d3-geo";
	import { feature } from "topojson-client";

	let {
		zoom = $bindable(1),
		width = 800,
		height = 250,
		interactive = true,
		locationList,
		markerList,
		lineList,
		framePaddingOffset = {}, // { top, right, bottom, left } extra viewBox-unit padding added per side on top of the base
		class: className = "",
		onclick,
	} = $props();

	const FRAME_PADDING = 70; // Viewbox units of base padding kept around content when auto-framing
	const FLAG_CLOTH_PATH = "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z";

	let mapContainer = $state();
	let features = $state([]);
	let projectionVersion = $state(0); // Bumped on every re-projection so derived points/markers/lines refresh

	let projection = geoMercator();
	let path = $state(geoPath().projection(projection));

	// Derived projected points/markers/lines so we don't duplicate the props into state.
	let projectedPoints = $derived.by(() => {
		projectionVersion; // Re-run when projection changes
		return (locationList || []).map(([lat, lon], i) => {
			const [x, y] = projection([lon, lat]);
			return { lat, lon, x, y, uniqueKey: `point-${i}` };
		});
	});
	// Markers are sorted so flags render last (on top of dots).
	let projectedMarkers = $derived.by(() => {
		projectionVersion;
		return (markerList || [])
			.map((m, i) => {
				const [x, y] = projection([m.lon, m.lat]);
				return { ...m, x, y, uniqueKey: m.uniqueKey ?? `marker-${i}` };
			})
			.sort((a, b) => (a.shape === "flag") - (b.shape === "flag"));
	});
	let projectedLines = $derived.by(() => {
		projectionVersion;
		return (lineList || []).map((l, i) => {
			const [x1, y1] = projection([l.from.lon, l.from.lat]);
			const [x2, y2] = projection([l.to.lon, l.to.lat]);
			return { x1, y1, x2, y2, uniqueKey: l.uniqueKey ?? `line-${i}` };
		});
	});

	let translateX = 0;
	let translateY = 0;

	const MIN_ZOOM = 0.5;
	const MAX_ZOOM = 20;

	let loaded = $state(false);

	async function fetchTopoJSON() {
		try {
			const response = await fetch(`/json/topojson/world-110m.json`);
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

	let centerLat = $state(35);
	let centerLon = $state(0);

	function updateProjection() {
		// Calculate the scale based on the map container size and region zoom
		const minDimension = Math.min(width, height);
		const scale = (minDimension / 2) * zoom;

		projection.scale(scale).center([centerLon, centerLat]).translate([translateX, translateY]);
		path = geoPath().projection(projection);
		projectionVersion++;
	}

	// Collect every coordinate the consumer passed in so we can fit them all on screen.
	function collectCoordinates() {
		const coords = [];
		for (const [lat, lon] of locationList || []) coords.push([lat, lon]);
		for (const m of markerList || []) coords.push([m.lat, m.lon]);
		for (const l of lineList || []) {
			coords.push([l.from.lat, l.from.lon]);
			coords.push([l.to.lat, l.to.lon]);
		}
		return coords;
	}

	// Fit the projection so all provided coordinates are visible with padding around them.
	function fitToContent() {
		const coords = collectCoordinates();
		if (coords.length === 0) return;

		const padTop = FRAME_PADDING + (framePaddingOffset.top || 0);
		const padRight = FRAME_PADDING + (framePaddingOffset.right || 0);
		const padBottom = FRAME_PADDING + (framePaddingOffset.bottom || 0);
		const padLeft = FRAME_PADDING + (framePaddingOffset.left || 0);

		const lats = coords.map(([lat]) => lat);
		const lons = coords.map(([, lon]) => lon);
		centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
		centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;

		// Aim the projection so the content's midpoint lands in the middle of the usable area (i.e. shifted away from the larger padding sides).
		zoom = 1;
		translateX = (padLeft + (width - padRight)) / 2;
		translateY = (padTop + (height - padBottom)) / 2;
		const minDimension = Math.min(width, height);
		projection.scale(minDimension / 2).center([centerLon, centerLat]).translate([translateX, translateY]);

		const projected = coords.map(([lat, lon]) => projection([lon, lat]));
		const xs = projected.map(([x]) => x);
		const ys = projected.map(([, y]) => y);
		const spanX = Math.max(...xs) - Math.min(...xs);
		const spanY = Math.max(...ys) - Math.min(...ys);

		const usableWidth = Math.max(1, width - padLeft - padRight);
		const usableHeight = Math.max(1, height - padTop - padBottom);
		const fitZoom = Math.min(usableWidth / Math.max(spanX, 1), usableHeight / Math.max(spanY, 1));
		zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitZoom));
	}

	function generatePaths() {
		features = features
			.map((feature, index) => {
				const d = path(feature);
				return d ? { ...feature, d, uniqueKey: `feature-${index}` } : null;
			})
			.filter(Boolean);
	}

	// Drag & Zoom --------------------------------------------------------------------------------------------------------------------------
	let isDragging = false;
	let lastX, lastY;

	function handleZoom(event) {
		if (!interactive) return;
		event.preventDefault();

		const rect = mapContainer.getBoundingClientRect();

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
		const rect = mapContainer.getBoundingClientRect();
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
			const rect = mapContainer.getBoundingClientRect();

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
				const rect = mapContainer.getBoundingClientRect();
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

	function handleTouchEnd() {
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

// Mounting, drawing and framing --------------------------------------------------------------------------------------------------------------------------
	function frameMap() {
		fitToContent();
		updateProjection();
		generatePaths();
	}

	onMount(async () => {
		const geoData = await fetchTopoJSON();
		if (geoData && (locationList || markerList || lineList)) {
			features = geoData.features;
			frameMap();
			lastFingerprint = JSON.stringify(collectCoordinates());
			loaded = true;
		}
	});

	// Re-frame whenever the content (markers/lines/locations) changes after initial mount
	// Track a fingerprint string of the coordinates so we only re-frame when they actually change
	let lastFingerprint = "";
	$effect(() => {
		const fp = JSON.stringify(collectCoordinates());
		if (!loaded) return;
		if (fp === lastFingerprint) return;
		lastFingerprint = fp;
		frameMap();
	});
</script>

<div class="map-container {className}" bind:this={mapContainer}>
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
						<path
							d={feature.d}
							fill="var(--box-color)"
							stroke="rgba(255, 255, 255, 0.2)"
							stroke-width="0.5"
							vector-effect="non-scaling-stroke"
							class="feature-path"
						/>
					{/each}
				</g>

				<g>
					{#each projectedLines as line (line.uniqueKey)}
						<line
							x1={line.x1}
							y1={line.y1}
							x2={line.x2}
							y2={line.y2}
							stroke="var(--brand-color)"
							stroke-width="1.5"
							stroke-dasharray="4 3"
							vector-effect="non-scaling-stroke"
						/>
					{/each}
				</g>

				<g>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					{#each projectedPoints as point (point.uniqueKey)}
						<g
							onclick={() => onclick?.({ lat: point.lat, lon: point.lon })}
							class="point-feature"
							transform={`translate(${point.x},${point.y})`}
						>
							<!-- Outline + fill passes to match the flag's halo style (no inner stroke over the fill). -->
							<circle r="7" fill="var(--dark-background)" />
							<circle r="5" fill="var(--brand-color)" class="point-circle" />
						</g>
					{/each}
				</g>

				<g>
					<!-- projectedMarkers is sorted so flags render last (on top of dots). -->
					{#each projectedMarkers as marker (marker.uniqueKey)}
						<g class="marker-feature" transform={`translate(${marker.x},${marker.y})`}>
							{#if marker.shape === "flag"}
								<!-- Lucide flag icon, anchored at the pole base. Drawn in two passes (dark outline, then brand fill) so the halo is uniform on cloth and pole. -->
								<g transform="translate(-3.2,-17.6) scale(0.8)" stroke-linecap="round" stroke-linejoin="round">
									<path d={FLAG_CLOTH_PATH} fill="var(--dark-background)" stroke="var(--dark-background)" stroke-width="6" />
									<line x1="4" x2="4" y1="22" y2="15" stroke="var(--dark-background)" stroke-width="6" />
									<path d={FLAG_CLOTH_PATH} fill="var(--brand-color)" stroke="var(--brand-color)" stroke-width="2" />
									<line x1="4" x2="4" y1="22" y2="15" stroke="var(--brand-color)" stroke-width="2" />
								</g>
							{:else}
								<circle r="7" fill="var(--dark-background)" />
								<circle r="5" fill="var(--brand-color)" />
							{/if}
							{#if marker.label}
								<text
									class="marker-label"
									x="0"
									y={marker.shape === "flag" ? -22 : -14}
									text-anchor="middle"
									fill="white"
								>{marker.label.length > 12 ? marker.label.slice(0, 12) + "…" : marker.label}</text>
							{/if}
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
		filter: brightness(0.75);
	}

	.point-feature:hover .point-circle {
		fill: white;
	}

	.marker-label {
		font-size: 18px;
		font-weight: 600;
		paint-order: stroke;
		stroke: var(--dark-background);
		stroke-width: 3px;
		stroke-linejoin: round;
		pointer-events: none;
		user-select: none;
	}

</style>
