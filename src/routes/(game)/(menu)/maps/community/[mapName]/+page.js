import { accountUrl } from '$lib/stores/context-specific/apiConfigStore.js';
import { get } from 'svelte/store';

// Load Map data
export async function load({ params }) {
  const { mapName } = params; // Extract mapName from the route

  try {
    const response = await fetch(get(accountUrl) + `/maps/${mapName.replaceAll("_", " ")}`);
    if (!response.ok) throw new Error('Failed to fetch map data');

    const mapData = await response.json();

    try {
      // Second fetch: Get the actual map JSON data from the Spaces URL
      if (!mapData.map_data_url) throw new Error("No map data URL provided");
      const mapContentResponse = await fetch(mapData.map_data_url);
      if (!mapContentResponse.ok) throw new Error('Failed to fetch map content from object storage');

      // Parse the JSON response
      const mapContent = await mapContentResponse.json();
      mapData.map_data = mapContent; // Add the map content to the mapData object

    } catch (error) {
      throw new Error('Failed to load map content json: ' + error.message);
    }

    // Return the complete map data to be available in the page
    return mapData;
  } catch (error) {
    console.error('Error loading map data:', error);
    throw error;
  }
}
