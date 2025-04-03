<!-- Control which music to play -->
<script>
	import { resultScreenEnabled } from "$lib/stores/context-specific/resultScreenStore";
	import { playMusic } from "$lib/utils/soundManager";

	resultScreenEnabled.subscribe((value) => {
		if (value) {
			playMusic("chill");
		} else {
			playMusic("regular");
		}
	});
</script>
