// Load Map data
export async function load({ params }) {
  const { mapName } = params; // Extract mapName from the route

  try {
    const response = await fetch(`https://maps.openguessr.com/maps/${mapName.replaceAll("_", " ")}`);

    if (!response.ok) {
      throw new Error('Failed to fetch map data');
    }

    const mapData = await response.json();

    // Return the map data to be available in the page
    return mapData;

  } catch (error) {
    console.error('Error loading map data:', error);

    // Handle error gracefully (e.g., show error page or fallback)
    return {
      status: 500,
      error: new Error('Could not load the map data.')
    };
  }
}
