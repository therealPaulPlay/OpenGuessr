<script>
	function goBack() {
		if (document.referrer) {
			window.history.back();
		} else {
			window.location.href = "/"; // Fallback if no referrer
		}
	}
</script>

<button class="backButton standardButton white" onclick={goBack}>
	<img src="/img/arrow_icon.png" alt="Expand or close arrow" class="backButtonArrowIcon" />
	Back</button
>

<style>
	.backButton {
		margin-right: auto !important;
		font-size: 25px;
		width: fit-content;
		height: 50px;
		line-height: 20px;
		border-radius: 10px;
		margin: 20px 20px;
	}

	.backButtonArrowIcon {
		width: 25px;
		height: 25px;
		transform: rotate(90deg);
		vertical-align: -4px;
	}

	.backButton:hover {
		filter: brightness(0.7);
	}
</style>
