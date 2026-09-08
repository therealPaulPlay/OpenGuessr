<script>
	import GetStarted from "$lib/components/GetStarted.svelte";
</script>

<svelte:head>
	<title>Joga GeoGuessr grátis agora</title>
</svelte:head>

<GetStarted
	imgName="get_started_portuguese.jpg"
	ctaTitle="Está na hora de começares."
	ctaButton="Jogar agora"
	content={[
		{
			heading: "A alternativa grátis ao GeoGuessr.",
			paragraph: `Uma emocionante viagem de geografia espera por ti. Com o OpenGuessr, podes viajar pelo mundo sem gastar um
		cêntimo. Baseado em imagens reais do Street View, mergulha no maior jogo de adivinhar geografia completamente
		ilimitado e grátis. Não precisas de conta.`,
		},
		{
			heading: "Zero paywalls, em lado nenhum.",
			paragraph: `“Open” faz parte do nome por alguma razão — nenhum modo, funcionalidade ou parte do jogo está bloqueado atrás de
		um paywall, está tudo aberto para explorares. Financiado por vantagens de apoiantes que dão itens cosméticos,
		pequenos boosts e uma experiência sem anúncios.`,
		},
		{
			heading: "Mapas que vais adorar.",
			paragraph: `Começa um jogo diretamente num mapa à tua escolha. Aqui, escolhemos alguns que combinam contigo e com a tua
		língua. Contêm locais desde a Torre de Belém até ao Cristo Redentor — queres experimentar um?`,
		},
		{
			heading: "A melhor forma de jogar grátis.",
			paragraph: `Vê o panorama, coloca o pin e confirma o teu palpite para descobrires onde estás — o OpenGuessr é a experiência
		grátis de adivinhar geografia que andavas à procura. Junta-te aos amigos no multiplayer, compete em duelos, ou vê
		como te comparas aos outros nas competições.`,
			paragraph2: `Se preferires explorar a solo, dezenas de milhares de mapas, um mapa-mundo regenerado automaticamente e um modo
		blink integrado esperam por ti. Define um temporizador, ou joga ao teu ritmo. Para iniciantes, o Country Guessr e o
		Meta Guessr ajudam-te a evoluir rápido, e o OpenGuessr Education põe conhecimento de jogador profissional ao
		alcance dos teus dedos.`,
		},
	]}
	maps={["Better Portugal", "Urban Brazil", "Sao Tome Principe"]}
/>
