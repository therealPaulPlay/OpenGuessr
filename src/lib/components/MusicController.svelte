<!-- Control which music to play -->
<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { page } from "$app/state";
	import { playMusic } from "$lib/utils/soundManager";

	$effect(() => {
		if ($resultScreenEnabled || page.url.pathname !== "/") {
			playMusic("chill");
		} else {
			playMusic("regular");
		}
	});
</script>
