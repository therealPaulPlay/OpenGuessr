import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Prerendered routes are served as static assets, non-prerendered routes are SSR'd by a page function
		adapter: adapter({
			// Wildcard the static dirs to avoid enumeration (since there's a limit of 100 exclude rules)
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