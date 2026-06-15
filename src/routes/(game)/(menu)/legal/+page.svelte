<script>
	import { errorPopup } from "$lib/utils/errorHandling";

	function openConsentManager() {
		try {
			if (!window.__tcfapi) throw new Error("Not loaded!");
			window.__tcfapi("displayConsentUi", 2, function (result) {
				console.log("Consent UI triggered:", result);
			});
		} catch (error) {
			console.error("TCF API error:", error);
			errorPopup(
				"TCF API not loaded",
				"The consent management system is not loaded. This is common when using an ad blocker.",
			);
		}
	}
</script>

<svelte:head>
	<title>Legal</title>
</svelte:head>

<div class="text-container">
	<h1>Introduction</h1>
	<p>
		This page informs users about data collection, applicable terms, and how to contact the developer. By using this
		website, you accept the agreements and policies outlined here. Some details are provided on separate linked pages.
		For questions about these policies, please use the contact form linked at the bottom of this page.
	</p>
	<br />
	<p>
		Imprint: For contact details, see <a href="https://paulplay.studio/imprint" target="_blank">this page</a>.
	</p>
	<p>
		Terms of Use: Refer to <a href="https://paulplay.studio/terms-of-use" target="_blank">this page</a>.
	</p>
	<p>
		EULA: For the End User License Agreement, see <a href="https://paulplay.studio/eula" target="_blank">this page</a>.
	</p>
	<br />
	<br />
	<h1>Preferences</h1>
	<p>
		Under CCPA ("California Consumer Privacy Act"), Californian residents have the right to declare their preferences on
		the sale of data for advertising and marketing purposes. If you wish to change your preferences, click this button
		to launch the preference portal:
	</p>
	<br />
	<button class="consent-button" onclick={openConsentManager}>Preferences</button>
	<br />
	<br />
	<br />

	<h1>Privacy Policy</h1>
	<p>
		This service is provided by PaulPlay at no cost and is intended for use as is. By using this Service, you agree to
		the collection and use of information as described.
	</p>
	<br />
	<br />
	<h2>What data we collect</h2>
	<p>
		Google Maps collects browser details and site data. Please review their <a
			href="https://policies.google.com/privacy"
			target="_blank">privacy policy</a
		>.
	</p>
	<br />
	<p>
		With your consent, we use Google Analytics and cookies to track how you interact with OpenGuessr. Google Analytics
		collects:
	</p>
	<br />
	<ul>
		<li>Pages you visit on OpenGuessr</li>
		<li>Time spent on each page</li>
		<li>How you arrived at the site</li>
		<li>Actions taken on the site</li>
	</ul>
	<br />
	<p>
		If you register an account, we collect your username, IP address (to ensure multiplayer security and prevent
		cheating), game-realted statistics and data you provide such as, but not limited to, your email and username. By
		creating an account you accept that we may share non-sensitive information with other users. We also store
		game-related details like your account level.
	</p>
	<br />
	<p>
		We use Stripe for processing payments. Please read their <a href="https://stripe.com/privacy" target="_blank"
			>privacy policy</a
		>.
	</p>
	<br />
	<p>
		We use a third-party to provide monetisation technologies for our site. You can review their <a
			href="https://publift.com/privacy-policy/"
			target="_blank">privacy and cookie policy</a
		>.
	</p>
	<br />
	<br />

	<h2>How we use your data</h2>
	<p>
		Data collected through Google Analytics is transferred to and analyzed by Google. We also use collected data, such
		as usernames, for multiplayer functionalities, which may be shared with other players.
	</p>
	<br />
	<br />

	<h2>Why we collect data</h2>
	<p>
		Data collection helps us improve OpenGuessr, enhance its performance, and resolve issues. Additionally, data enables
		enriched multiplayer experiences.
	</p>
	<br />
	<br />

	<h2>How long we keep your data</h2>
	<p>
		Personal data is retained only as long as necessary for stated purposes or to comply with legal requirements. If you
		delete your account via the profile menu, your data will be deleted within 30 days or less.
	</p>
	<br />
	<br />

	<h2>How we keep your data secure</h2>
	<p>
		We take extensive measures to secure your data, including encryption and secure storage practices. All third parties
		processing data for OpenGuessr are required to uphold similar standards. Passwords are stored as hashes only.
	</p>
	<br />
	<br />

	<h2>Changes to this policy</h2>
	<p>
		Changes to this privacy notice will update the 'last updated' date below. Any updates will apply immediately. If
		significant changes affect data processing, reasonable efforts will be made to notify users.
		<br /> <br />
		Last updated: 21st of May, 2025
	</p>
	<br />
	<br />
	<h2>Contact</h2>
	<p>
		For questions, contact us via the contact form at the bottom of <a
			href="https://paulplay.studio/legal"
			target="_blank">our legal page</a
		>.
	</p>
</div>

<style>
	h1 {
		margin-bottom: var(--layout-margin);
	}

	h2 {
		margin-bottom: var(--box-margin);
	}

	.text-container {
		margin-inline: auto;
		margin-bottom: var(--layout-spacer);
		max-width: 900px;
	}

	.consent-button {
		font-size: 22px;
		color: white;
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}
</style>
