<script>
	function goBack() {
		if (document.referrer) return window.history.back();
		window.location.href = "/"; // Fallback if no referrer
	}
</script>

<button class="backButton standardButton white" onclick={goBack}>
	<img src="/img/arrow_icon.png" alt="Expand or close arrow" class="backButtonArrowIcon" />
	Back</button
>

<style>
	.backButton {
		margin-right: auto !important;
		width: fit-content;
		height: 50px;
		line-height: 20px;
		border-radius: 10px;
		margin: 25px 20px;
	}

	.backButtonArrowIcon {
		width: 25px;
		height: 25px;
		transform: rotate(90deg);
		vertical-align: -4px;
	}
</style>
