<!-- A UI component with a + and - button to change a value -->
<script>
	let {
		note,
		step = 1,
		maximum = 5,
		minimum = 1,
		initialValue = 1,
		value = $bindable(initialValue),
		minimumText,
	} = $props();
	import { playSound } from "$lib/utils/soundManager";
</script>

<div class="ticker">
	<button
		id="roundMinus"
		class="standardButton white"
		disabled={Number(value) === Number(minimum)}
		onclick={() => {
			playSound("change_value");
			value = Number(value) - Number(step);
			if (Number(value) < Number(minimum)) value = Number(minimum);
		}}>-</button
	>
	<p class="tickerText">{value !== minimum ? value : minimumText ? minimumText : value}</p>
	{#if note}
		<p class="tickerNote">{note}</p>
	{/if}
	<button
		id="roundPlus"
		class="standardButton white"
		disabled={Number(value) === Number(maximum)}
		onclick={() => {
			playSound("change_value");
			value = Number(value) + Number(step);
			if (Number(value) > Number(maximum)) value = Number(maximum);
		}}>+</button
	>
</div>

<style>
	.tickerText {
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: var(--bulb-shadow);
		padding: var(--content-margin);
		padding-left: var(--box-margin);
		padding-right: var(--box-margin);
		text-align: center;
		border-radius: var(--content-margin);
		font-size: 20px;
		min-width: 30px;
	}

	.tickerNote {
		font-size: 20px;
	}

	.ticker {
		display: flex;
		gap: var(--box-margin);
		box-shadow: var(--box-shadow);
		border-radius: var(--box-margin);
		justify-content: left;
		padding: var(--panel-margin);
		width: fit-content;
		align-items: center;
		margin-bottom: var(--box-margin);
		margin-top: var(--box-margin);
		flex-wrap: wrap;
		background-color: rgba(255, 255, 255, 0.1);
	}
</style>
