<script>
	let { text = "Default", noMargin = false, class: classes } = $props();
</script>

<div class="flex-container {classes}" class:no-margin={noMargin}>
	<p>{text}</p>
	<div class="line"></div>
</div>

<style>
	.line {
		height: 2px;
		background-color: white;
		opacity: 0.15;
		flex-grow: 1;
		border-radius: var(--box-margin);
		margin-top: var(--content-margin);
	}

	.flex-container {
		display: flex;
		justify-content: space-between;
		width: calc(100%);
		margin-top: var(--layout-margin);
		margin-bottom: var(--layout-margin);
		align-items: center;
		box-sizing: border-box;
	}

	.no-margin {
		margin: 0;
	}

	.flex-container p {
		opacity: 0.5;
		padding-right: var(--layout-margin);
	}
</style>
