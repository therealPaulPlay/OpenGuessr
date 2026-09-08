<script>
	import GetStarted from "$lib/components/GetStarted.svelte";
</script>

<svelte:head>
	<title>Jouer gratuitement à GeoGuessr</title>
</svelte:head>

<GetStarted
	imgName="get_started_french.jpg"
	ctaTitle="C'est le moment de commencer."
	ctaButton="Jouer"
	content={[
		{
			heading: "L'alternative gratuite à GeoGuessr.",
			paragraph: `Un voyage géographique passionnant t'attend. Avec OpenGuessr, tu peux explorer le monde sans dépenser un
		centime. Basé sur de vraies images Street View, plonge dans le plus grand jeu de devinettes géographiques,
		entièrement gratuit et sans limites. Aucun compte requis.`,
		},
		{
			heading: "Aucun paywall, nulle part.",
			paragraph: `Le mot « Open » dans le nom n'est pas là par hasard — aucun mode, aucune fonctionnalité et aucun aspect du jeu
		n'est bloqué derrière un paywall, tout est ouvert à l'exploration. Financé par des avantages de soutien offrant des
		cosmétiques, de légers boosts et une expérience sans publicité.`,
		},
		{
			heading: "Des cartes qui pourraient te plaire.",
			paragraph: `Lance une partie directement sur la carte de ton choix. Nous en avons sélectionné quelques-unes qui pourraient te
		convenir, à toi et ta langue. Elles contiennent des lieux allant de la Tour Eiffel à la Grand-Place de Bruxelles —
		on se lance ?`,
		},
		{
			heading: "La meilleure façon de jouer gratuitement.",
			paragraph: `Observe le panorama, place ton marqueur et valide ta réponse pour découvrir où tu te trouves — OpenGuessr est
		l'expérience gratuite de devinettes géographiques que tu cherchais. Fais équipe avec des amis en multijoueur,
		défie-les en duels ou mesure-toi aux autres lors de compétitions.`,
			paragraph2: `Si tu préfères explorer en solo, des dizaines de milliers de cartes, une carte du monde régénérée automatiquement
		et un mode blink intégré t'attendent. Active un minuteur ou joue à ton rythme. Pour les débutants, Country Guessr
		et Meta Guessr t'aident à progresser rapidement, tandis qu'OpenGuessr Education met le savoir des pros à ta portée.`,
		},
	]}
	maps={["Cities of France", "Stations in Belgium", "North of Luxembourg"]}
/>
