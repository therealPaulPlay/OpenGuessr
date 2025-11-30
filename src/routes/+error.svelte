<script>
	import { ArrowLeft } from "@lucide/svelte";
	import { page } from "$app/state";
</script>

<svelte:head>
	<title>OpenGuessr - Error</title>
</svelte:head>

<div class="page-content">
	<h1>{page.status} - {page.error.message}</h1>
	<p>The page you requested does not exist or experienced an error.</p>
	<a class="returnButton standardButton" href="/">
		<ArrowLeft style="min-width: 22px; margin-bottom: -3px;" strokeWidth={2.5} />
		Return to OpenGuessr</a
	>
</div>

<style>
	.page-content {
		height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	h1 {
		font-size: 70px;
		word-wrap: break-word;
		text-wrap: wrap;
		text-align: center;
		padding-inline: 20px;
	}

	p {
		text-align: center;
		margin-top: 40px;
		max-width: 400px;
		font-size: 30px;
		padding-inline: 20px;
	}

	a,
	a:hover,
	a:visited {
		text-decoration: none;
		color: white;
	}

	.returnButton {
		font-size: 25px;
		padding: 15px 20px;
		border-radius: var(--box-margin);
		margin-top: 100px;
		text-decoration: none;
		height: unset;
	}

	@media (max-width: 800px) {
		h1 {
			font-size: 40px;
		}

		p {
			font-size: 25px;
		}

		.returnButton {
			font-size: 22px;
		}
	}
</style>
