import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		paths: {
			relative: false // Root-relative asset paths so the SPA fallback works at nested routes (e.g. /maps/community/...)
		},
		adapter: adapter({
			// Cloudflare in SPA mode (active when no 404.html is present) routes requests for files that don't exist to index.html
			// https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering
			// To satisfy adapter-static, we still need a fallback html (which isn't used), since dynamic routes exist
			// These dynamic routes get served the pre-rendered index.html, then JS takes over and constructs the actual route (e.g. the community map page)
			fallback: 'unused.html'
		})
	}
};

export default config;