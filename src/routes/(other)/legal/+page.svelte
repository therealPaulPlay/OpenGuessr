<script>
	import PageBack from "$lib/components/PageBack.svelte";

	function openConsentManager() {
		// Try direct gtag approach to force consent UI
		if (typeof window.gtag === "function") {
			// Force reopen consent UI by revoking all consent
			window.gtag("consent", "update", {
				ad_storage: "denied",
				analytics_storage: "denied",
				ad_user_data: "denied",
				ad_personalization: "denied",
				wait_for_update: 0,
			});

			// Then immediately request default state which should trigger UI
			setTimeout(() => {
				window.gtag("consent", "default", {
					ad_storage: "denied",
					analytics_storage: "denied",
					ad_user_data: "denied",
					ad_personalization: "denied",
					wait_for_update: 500,
				});
			}, 100);
		} else if (window.dataLayer) {
			// Alternative approach using dataLayer directly
			window.dataLayer.push({
				event: "consent_update",
				consent_action: "revoke",
			});
		} else {
			console.error("No Google tag APIs available");
			alert("Unable to open consent manager. Please clear your cookies and reload the page.");
		}
	}
</script>

<svelte:head>
	<title>Legal</title>
</svelte:head>

<div id="navbar">
	<PageBack />
	<h1 id="navbarTitle">Legal</h1>
</div>

<div class="center">
	<div id="parent">
		<div id="text">
			<h1>Introduction</h1>
			<br />
			<p>
				This page informs users about data collection, applicable terms, and how to contact the developer. By using this
				website, you accept the agreements and policies outlined here. Some details are provided on separate linked
				pages. For questions about these policies, please use the contact form linked at the bottom of this page.
			</p>
			<br />
			<p>
				Imprint: For contact details, see <a href="https://paulplay.studio/imprint" target="_blank">this page</a>.
			</p>
			<p>
				Terms of Use: Refer to <a href="https://paulplay.studio/terms-of-use" target="_blank">this page</a>.
			</p>
			<p>
				EULA: For the End User License Agreement, see <a href="https://paulplay.studio/eula" target="_blank"
					>this page</a
				>.
			</p>
			<br />
			<p>Need to adjust your cookie settings?</p>
			<button class="consentButton" onclick={openConsentManager}>Manage consent</button>
			<br /><br />

			<h1>Privacy Policy</h1>
			<br />
			<p>
				This service is provided by PaulPlay at no cost and is intended for use as is. By using this Service, you agree
				to the collection and use of information as described. Personal Information collected is used to provide and
				improve the Service. Your data will not be shared except as detailed in this Privacy Policy.
			</p>
			<br />
			<h2>What data we collect</h2>
			<p>
				Partners such as Google and Stripe collect browser details and site usage data via page tagging techniques.
				Google Maps Streetview, used in this application, has its own <a
					href="https://policies.google.com/privacy"
					target="_blank">privacy policy</a
				>. With your consent, we use Google Analytics and cookies to track how you interact with OpenGuessr.
				<br /><br />
				If you register an account, we collect your username, IP address (to ensure multiplayer security and prevent cheating),
				game-realted statistics and your email. By creating an account you accept that we may share non-sensitive information
				with other users. We also store game-related details like your account level. Purchasing items involves data processed
				by Stripe—please see their
				<a href="https://stripe.com/privacy" target="_blank">privacy policy</a>.
				<br /><br />
				Google Analytics collects:
				<br />
				- Pages you visit on OpenGuessr<br />
				- Time spent on each page<br />
				- How you arrived at the site<br />
				- Actions taken on the site<br />
			</p>
			<br /> <br />

			<h2>How we use your data</h2>
			<p>
				Data collected through Google Analytics is transferred to and analyzed by Google. We also use collected data,
				such as usernames, for multiplayer functionalities, which may be shared with other players.
			</p>
			<br /> <br />

			<h2>Why we collect data</h2>
			<p>
				Data collection helps us improve OpenGuessr, enhance its performance, and resolve issues. Additionally, data
				enables enriched multiplayer experiences.
			</p>
			<br /> <br />

			<h2>How long we keep your data</h2>
			<p>
				Personal data is retained only as long as necessary for stated purposes or to comply with legal requirements. If
				you delete your account via the profile menu, your data will be deleted within 30 days or less.
			</p>
			<br /> <br />

			<h2>How we keep your data secure</h2>
			<p>
				We take extensive measures to secure your data, including encryption and secure storage practices. All third
				parties processing data for OpenGuessr are required to uphold similar standards. Passwords are stored as hashes
				only.
			</p>
			<br /> <br />

			<h2>Changes to this policy</h2>
			<p>
				Changes to this privacy notice will update the 'last updated' date below. Any updates will apply immediately. If
				significant changes affect data processing, reasonable efforts will be made to notify users.
				<br /> <br />
				Last updated: 21st of May, 2025
			</p>
			<br /> <br />
			<h2>Contact</h2>
			<p>
				For questions, contact us via the <a href="https://paulplay.studio/legal" target="_blank">contact form</a> at the
				bottom of this page.
			</p>
		</div>
	</div>
</div>

<style>
	.center {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 20px 0;
		overflow-y: scroll;
	}

	#navbar {
		position: fixed;
		z-index: 100;
		width: 100%;
		top: 0;
		display: flex;
		justify-content: space-around;
		height: 100px;
		background-color: rgb(27, 28, 43);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	#navbarTitle {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		color: white;
	}

	h2 {
		margin-bottom: 10px;
	}

	#text {
		width: 75%;
		max-width: 1150px;
		padding: 40px;
	}

	#parent {
		display: flex;
		justify-content: center;
		margin-top: 100px;
	}

	.consentButton {
		font-size: 22px;
		color: white;
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

	@media all and (max-width: 800px) {
		#text {
			width: 80%;
		}

		h1 {
			font-size: 40px;
		}

		h2 {
			font-size: 30px;
		}

		p {
			font-size: 22px;
		}
	}
</style>
