<script>
	import { profileId } from "$lib/stores/context-specific/profileStore";
	import { reportPopup } from "$lib/stores/uiStore";
	import IframePopup from "./ui/IframePopup.svelte";

	let link = $derived(
		`https://openreport.dev/report?type=user&reference-id=user-${$profileId}&key=838c115d03441bbdbc2b5fbdccaf2d4b&link=https%3A%2F%2Fopenguessr.com%3Fprofile-id%3D${$profileId}&reasons=Misconduct%2CCheating%2CGoogling`,
	);
</script>

<IframePopup src={link} bind:open={$reportPopup} />
