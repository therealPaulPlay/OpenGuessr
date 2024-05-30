window['gtag_enable_tcf_support'] = true;

const imported = document.createElement('script');
imported.src = "https://www.googletagmanager.com/gtag/js?id=G-DXD64B7ZDX";
document.head.appendChild(imported);

try {
	window.dataLayer = window.dataLayer || [];
	function gtag() { dataLayer.push(arguments); }

	gtag('js', new Date());

	gtag('config', 'G-DXD64B7ZDX', {
		cookie_domain: location.hostname,
		cookie_flags: "SameSite=None; Secure",
	});
} catch (error) {
	console.error("Error loading GA4 in analytics.js: " + error);
}