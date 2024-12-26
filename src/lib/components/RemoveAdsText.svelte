<script>
	import { supporterWindowIfAuthenticated } from "$lib/utils/showSupporterPopup";
	let { text, learnMore } = $props();
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<p class="adsTextResult noAdvertsText">
	{text}
	{#if learnMore}
		<span class="supporterAdText" onclick={supporterWindowIfAuthenticated} role="button">Learn more</span>.
	{/if}
</p>

<style>
	.adsTextResult {
		outline: none;
		background-color: transparent;
		opacity: 0.5 !important;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 80%;
	}

	.noAdvertsText {
		text-align: center;
		color: white;
		opacity: 0.25;
		font-size: 22px;
		overflow: hidden;
		transition: opacity 500ms ease;
		border-radius: 7px;
	}

	.supporterAdText {
		text-decoration: underline;
		cursor: pointer;
	}
</style>
