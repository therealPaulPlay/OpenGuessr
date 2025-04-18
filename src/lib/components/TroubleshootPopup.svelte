<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { troubleshootPopup } from "$lib/stores/uiStore";
	import { playSound } from "$lib/utils/soundManager";
</script>

{#if $troubleshootPopup}
	<Popup z={910} verySlim={true}>
		<div class="popup-title">
			<h1>Troubleshooting</h1>
		</div>
		<p>
			OpenGuessr uses a peer-to-peer system with WebRTC data channels. Follow these steps to ensure a smooth experience:
			<br />
			<br />
		</p>
		<ul>
			<li>
				<p>Disable VPNs or Proxies.</p>
			</li>
			<li>
				<p>Disable Firewalls and ensure that your router doesn't restrict peer-2-peer.</p>
			</li>
			<li>
				<p>
					Check if the TURN servers are online – we use turn servers from <a
						href="https://fastturn.net/status"
						target="_blank"
					>
						fastturn
					</a>.
				</p>
			</li>
			<li>
				<p>Open chrome://webrtc-internals/ or about:webrtc for Firefox to inspect WebRTC errors.</p>
			</li>
		</ul>
		<p>If multiplayer still does not work, consider using a different wifi, cellular data or switch the host.</p>
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
