import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Prerendered routes are served as static assets, non-prerendered routes are SSR'd by a page function
		adapter: adapter({
			// Only spin up a page function for the two dynamic routes that lack fallback
			// Cloudflare only allows falling back to index.html, but using that as the Svelte fallback overrides the pre-rendered homepage,
			// and falling back to the regular index.html (with no Svelte fallback) doesn't trigger client-side navigation on load, hence not an option
			routes: {
				include: ['/maps/community/*', '/creator/*'],
				exclude: ['/*']
			}
		})
	}
};

export default config;