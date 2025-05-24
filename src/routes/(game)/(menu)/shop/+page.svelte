<script>
	import PinHolder from "$lib/components/PinHolder.svelte";
	import { tokens } from "$lib/stores/accountStore";

	const pinRarities = {
		common: {
			name: "common",
			pinIndexes: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109],
			price: 250,
		},
		rare: {
			name: "rare",
			pinIndexes: [200, 201, 202, 203, 204, 205, 206],
			price: 500,
		},
		epic: {
			name: "epic",
			pinIndexes: [300, 301, 302, 303, 304, 305, 306, 307],
			price: 750,
		},
		legendary: {
			name: "legendary",
			pinIndexes: [400, 401, 402, 403, 404, 405],
			price: 1000,
		},
	};
</script>

<div class="main-container">
	<div class="headerContainer">
		<h1 class="header">Shop</h1>
	</div>
	<div class="splitContainer">
		<div class="leftSide"></div>
		<div class="rightSide">
			<div class="tokenDisplay">
				<h3>{$tokens} Tokens</h3>
				<img class="tokenIcon" alt="token" src="/img/token_icon.png" />
			</div>
			<div class="tokenShop"></div>
		</div>
	</div>
	<div class="headerContainer">
		<h1 class="header">All pins</h1>
	</div>
	<div class="allPinsContainer">
		{#each Object.values(pinRarities) as rarity}
			{#each rarity?.pinIndexes as index}
				<PinHolder pinId={index} shop={true} rarity={rarity.name} price={rarity.price} />
			{/each}
		{/each}
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 50px;
	}

	.leftSide {
		border-radius: var(--layout-margin);
		flex-grow: 1;
		height: 100%;
		background-color: var(--box-color);
		padding: var(--box-margin);
		box-sizing: border-box;
		width: 400px;
		height: 500px;
	}

	.rightSide {
		border-radius: var(--layout-margin);
		flex-grow: 1;
		height: 100%;
		background-color: var(--box-color);
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 400px;
		height: 500px;
	}

	.tokenDisplay {
		width: 100%;
		height: 50px;
		display: flex;
		justify-content: end;
		align-items: center;
		gap: 5px;
		padding-inline: var(--layout-margin);
		box-sizing: border-box;
	}

	.tokenIcon {
		width: 32px;
		height: 32px;
		margin-top: 1px;
	}

	.tokenShop {
		width: 100%;
		flex-grow: 1;
		box-sizing: border-box;
		background-color: var(--box-color);
		border-radius: 15px;
		box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.15);
	}

	.splitContainer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		width: 100%;
		margin-bottom: 50px;
		gap: var(--layout-margin);
	}

	.allPinsContainer {
		width: 100%;
		height: fit-content;
		padding: var(--box-margin);
		display: flex;
		align-items: center;
		border-radius: 15px;
		background-color: var(--box-color);
		gap: var(--box-margin);
		flex-wrap: wrap;
		box-sizing: border-box;
	}
</style>
