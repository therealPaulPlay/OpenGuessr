<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { troubleshootPopup } from "$lib/stores/uiStore";
</script>

<Popup z={910} verySlim={true} bind:open={$troubleshootPopup}>
	<div class="popup-title">
		<h1>Troubleshooting</h1>
	</div>
	<p>
		If OpenGuessr multiplayer does not work for you, follow these steps to ensure a smooth experience:
		<br />
		<br />
	</p>
	<ul>
		<li>
			<p>Disable VPNs or Proxies.</p>
		</li>
		<li>
			<p>Disable firewalls on your computer & router.</p>
		</li>
		<li>
			<p>Try using a different wlan network or use cellular data.</p>
		</li>
	</ul>
	<p>Please consider joining the Discord server to get additional information and help from others.</p>
</Popup>
