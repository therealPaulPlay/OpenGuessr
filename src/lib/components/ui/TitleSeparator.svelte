<script>
	let { text = "Default" } = $props();
</script>

<div class="flexContainer">
	<p>{text}</p>
	<div class="line"></div>
</div>

<style>
	.line {
		height: 2px;
		background-color: white;
		opacity: 0.15;
		flex-grow: 1;
		border-radius: 10px;
		margin-top: 5px;
	}

	.flexContainer {
		display: flex;
		justify-content: space-between;
		width: calc(100%);
		margin-top: var(--layout-margin);
		margin-bottom: var(--layout-margin);
		align-items: center;
	}

	.flexContainer p {
		opacity: 0.5;
		padding-right: var(--layout-margin);
		font-style: italic;
	}
</style>
