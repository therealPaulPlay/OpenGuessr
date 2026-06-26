import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Prerendered routes are served as static assets, non-prerendered routes are SSR'd by a page function
		adapter: adapter({
			// Spin up a page function for every path that doesn't link to a static asset (so that dynamic routes, 404s etc. work)
			// Cloudflare only allows falling back to index.html, but using that as the Svelte fallback overrides the pre-rendered homepage,
			// and falling back to the regular index.html (with no Svelte fallback) doesn't trigger client-side navigation on load, hence not an option
			routes: {
				include: ['/*'],
				exclude: [
					'<build>',
					'<prerendered>',
					'/fonts/*',
					'/img/*',
					'/json/*',
					'/music/*',
					'/sounds/*',
					'/favicon.ico',
					'/sitemap.xml',
					'/robots.txt'
				]
			}
		})
	}
};

export default config;