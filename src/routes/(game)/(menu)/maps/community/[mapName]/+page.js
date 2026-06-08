// Dynamic, data is loaded on the client (API request to the backend from a server is frequently rate limited or blocked)
export const prerender = false;

export function load({ params }) {
  return { mapName: params.mapName };
}