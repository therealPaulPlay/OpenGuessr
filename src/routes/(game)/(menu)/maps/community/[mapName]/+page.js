import { apiUrl } from '$lib/stores/context-specific/apiConfigStore.js';
import { get } from 'svelte/store';
import { error } from '@sveltejs/kit';

// Load Map data
export async function load({ params, fetch }) {
  const { mapName } = params; // Extract mapName from the route

  try {
    // Use SvelteKit's fetch for better SSR/hydration compatibility
    const response = await fetch(get(apiUrl) + `/maps/${mapName.replaceAll("_", " ")}`);
    if (!response.ok) throw error(response.status, `Map not found`);

    const mapData = await response.json();
    if (!mapData.map_data_url) throw error(500, 'Map data URL missing!');

    try {
      const mapContentResponse = await fetch(mapData.map_data_url, { cache: 'no-cache' });
      if (!mapContentResponse.ok) throw error(500, 'Failed to fetch map content from object storage');

      // Parse response as json
      const mapContent = await mapContentResponse.json();
      mapData.map_data = mapContent;

      return mapData;

    } catch (fetchError) {
      console.error('Map content fetch error:', fetchError);
      throw error(500, 'Failed to load map content');
    }

  } catch (error) {
    console.error('Load function error:', error);
    if (error.status) throw error; // Re-throw SvelteKit errors
    throw error(500, 'Failed to load map data');
  }
}