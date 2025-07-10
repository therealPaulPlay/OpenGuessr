<script>
	import { reportPopup } from "$lib/stores/uiStore";
	import { reportUserId } from "$lib/stores/context-specific/reportPopupStore";
	import { playSound } from "$lib/utils/soundManager";
	import IframePopup from "./ui/IframePopup.svelte";

	let link = $derived(
		`https://openreport.dev/report?type=user&reference-id=user-${$reportUserId}&key=838c115d03441bbdbc2b5fbdccaf2d4b&link=https%3A%2F%2Fopenguessr.com%3Fprofile-id%3D${$reportUserId}&reasons=Misconduct%2CCheating%2CGoogling`,
	);
</script>

<IframePopup src={link} bind:open={$reportPopup} />
