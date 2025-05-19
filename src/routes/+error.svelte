<script>
	import { ArrowLeft } from "lucide-svelte";
	import { page } from "$app/stores";
</script>

<svelte:head>
	<title>OpenGuessr - Error</title>
</svelte:head>

<div id="page-content">
	<h1>{$page.status} - {$page.error.message}</h1>
	<p>The page you requested does not exist or experienced an error.</p>
	<a class="returnButton standardButton" href="/">
		<ArrowLeft size="18" />
		Return to OpenGuessr</a
	>
</div>

<style>
	#page-content {
		height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	h1 {
		font-size: 70px;
		font-weight: 500;
		word-wrap: break-word;
		text-wrap: wrap;
		text-align: center;
		color: white;
		padding-inline: 20px;
	}

	p {
		text-align: center;
		margin-top: 40px;
		max-width: 400px;
		font-size: 30px;
		color: white;
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
		border-radius: 10px;
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
