// Dynamic route, disable pre-rendering
export const prerender = false;

import { apiUrl } from '$lib/stores/context-specific/apiConfigStore.js';
import { get } from 'svelte/store';
import { error } from '@sveltejs/kit';

// Load map metadata for SSR, map file gets fetched on client
export async function load({ params }) {
  const { mapName } = params;

  // Global fetch is used intentionally since we don't want cors-emulation
  const response = await fetch(get(apiUrl) + `/maps/${encodeURIComponent(mapName.replaceAll("_", " "))}`);
  if (!response.ok) throw error(response.status, `Map not found`);

  const mapData = await response.json();
  if (!mapData.map_data_url) throw error(500, 'Map data URL missing!');

  return mapData;
}