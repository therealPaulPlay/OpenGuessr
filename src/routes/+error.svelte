<script>
	import { ArrowLeft } from "@lucide/svelte";
	import { page } from "$app/state";
	import { playSound } from "$lib/utils/soundManager";
	import { goto } from "$app/navigation";
</script>

<svelte:head>
	<title>OpenGuessr - Error</title>
</svelte:head>

<div class="page-content">
	<h1>{page.status} - {page.error.message}</h1>
	<p>The page you requested does not exist or experienced an error.</p>
	<button
		class="return-button standard-button"
		onclick={() => {
			playSound("basic_button");
			goto("/");
		}}
	>
		<ArrowLeft style="min-width: 22px; margin-bottom: -3px; margin-right: var(--content-margin);" strokeWidth={2.5} />
		Return to OpenGuessr</button
	>
</div>

<style>
	.page-content {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: safe center;
		align-items: safe center;
		padding: var(--layout-margin);
		box-sizing: border-box;
	}

	h1 {
		font-size: 70px;
		word-wrap: break-word;
		text-wrap: wrap;
		text-align: center;
	}

	p {
		text-align: center;
		margin-top: calc(var(--layout-margin) * 2);
		max-width: 400px;
		font-size: 30px;
	}

	.return-button {
		font-size: 25px;
		padding: var(--layout-margin) calc(var(--layout-margin) + var(--content-margin));
		border-radius: var(--box-margin);
		margin-top: calc(var(--layout-spacer) * 2);
		text-decoration: none;
		height: unset;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	@media (max-width: 800px) {
		h1 {
			font-size: 40px;
		}

		p {
			font-size: 25px;
		}

		.return-button {
			font-size: 22px;
		}
	}
</style>
