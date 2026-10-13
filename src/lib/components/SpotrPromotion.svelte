<script>
	import { playSound } from "$lib/utils/soundManager";
	import { ExternalLink } from "@lucide/svelte";
	import { Chip } from "openguessr-ui";
</script>

<div class="spotr-promo">
	<div class="content">
		<div class="left">
			<div class="left-text">
				<h2 class="heading">
					Spotr <Chip style="margin-top: auto; margin-bottom: 3px;" text="Experiment" red italic mutedOpacity={false} />
				</h2>

				<p style:opacity="0.75" style:margin-right="var(--layout-margin)">
					A multiplayer photography challenge taking place in Street View. Instead of looking for a location, you search for the
					perfect spot to capture in a given category.
				</p>
			</div>

			<button
				style="margin-top: auto;"
				class="standard-button large bright"
				onclick={() => {
					playSound("basic_button");
					window.open("https://spotr.openguessr.com", "_blank");
				}}
				>Play Spotr <ExternalLink
					size={20}
					strokeWidth={2.25}
					style="margin-bottom: -2px; margin-left: 3px;"
				/></button
			>
		</div>

		<div class="right">
			<img class="image" alt="Spotr" src="/img/spotr_promo.jpg" />
		</div>
	</div>
</div>

<style>
	.spotr-promo {
		background-color: var(--box-color);
		border-radius: var(--layout-margin);
		box-shadow: var(--panel-shadow);
		margin-top: var(--layout-spacer);
		width: 100%;
		container-type: inline-size;
		container-name: promotion;
	}

	.content {
		gap: var(--box-margin);
		padding: var(--box-margin);
		display: flex;
	}

	.left {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--layout-margin);
		border-radius: var(--box-margin);
		background-color: var(--box-color);
		padding: var(--box-margin);
		box-shadow: var(--box-shadow);
	}

	.left-text {
		display: flex;
		flex-direction: column;
		gap: var(--layout-margin);
		padding-inline: var(--content-margin);
	}

	.right {
		flex: 1;
		border-radius: var(--box-margin);
		overflow: hidden;
	}

	.image {
		object-fit: cover;
		width: 100%;
		height: 100%;
        aspect-ratio: 21/9;
	}

	.heading {
		display: flex;
		gap: var(--box-margin);
	}

	@container promotion (width < 800px) {
		.content {
			flex-direction: column;
            flex-direction: column-reverse;
		}
	}
</style>
