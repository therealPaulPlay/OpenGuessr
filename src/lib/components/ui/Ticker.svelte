<!-- A UI component with a + and - button to change a value -->
<script>
	let {
		note,
		step = 1,
		limit = 5,
		minimum = 1,
		initialValue = 1,
		value = $bindable(initialValue),
		lowerLimitText,
	} = $props();
	import { playSound } from "$lib/utils/soundManager";
</script>

<div class="ticker">
	<button
		id="roundMinus"
		class="standardButton white"
		onclick={() => {
			playSound("change_value");
			value = Number(value) - Number(step);
			if (Number(value) < Number(minimum)) value = Number(minimum);
		}}>-</button
	>
	<p id="roundAmountText" class="tickerText">{value !== minimum ? value : lowerLimitText ? lowerLimitText : value}</p>
	{#if note}
		<p class="tickerNote">{note}</p>
	{/if}
	<button
		id="roundPlus"
		class="standardButton white"
		onclick={() => {
			playSound("change_value");
			value = Number(value) + Number(step);
			if (Number(value) > Number(limit)) value = Number(limit);
		}}>+</button
	>
</div>

<style>
	.tickerText {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 5px;
		padding-left: 10px;
		padding-right: 10px;
		text-align: center;
		border-radius: 5px;
		font-size: 20px;
		min-width: 50px;
	}

	.tickerNote {
		font-size: 20px;
	}

	.ticker {
		display: flex;
		gap: 10px;
		border-radius: 10px;
		justify-content: left;
		padding: 5px;
		width: fit-content;
		align-items: center;
		margin-bottom: 10px;
		margin-top: 10px;
		flex-wrap: wrap;
		background-color: rgba(255, 255, 255, 0.1);
	}
</style>
