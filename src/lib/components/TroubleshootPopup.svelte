<script>
	import Popup from "$lib/components/Popup.svelte";
	import { troubleshootPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
</script>

{#if $troubleshootPopup}
	<Popup z="910" verySlim="true">
		<div class="popup-title">
			<h1>Troubleshooting Guide</h1>
		</div>
		<p>
			OpenGuessr uses a peer2peer connection system via WebRTC Datachannels. Follow these steps to ensure a smooth
			experience:
			<br />
			<br />
		</p>
		<ul>
			<li>
				<p>Disable VPNs or Proxies: Certain VPNs or Proxies, often browser extensions, block WebRTC connections.</p>
			</li>
			<li>
				<p>Disable Firewalls: Some restrictive firewall settings or wifi routers can block WebRTC.</p>
			</li>
			<li>
				<p>
					Check if the TURN servers are online: We use turn servers from <a
						href="https://fastturn.net/status"
						target="_blank"
					>
						fastturn
					</a>.
				</p>
			</li>
			<li>
				<p>Check if your browser supports WebRTC: Open chrome://webrtc-internals/ or about:webrtc for Firefox.</p>
			</li>
		</ul>
		<p>
			If multiplayer still does not work after following these steps, consider using a different wifi, cellular data or
			switch the host.
		</p>
		<button
			id="troubleshootClose"
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				troubleshootPopup.set(false);
			}}>Close</button
		>
	</Popup>
{/if}
