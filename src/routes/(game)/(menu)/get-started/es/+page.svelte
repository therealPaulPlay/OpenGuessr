<script>
	import GetStarted from "$lib/components/GetStarted.svelte";
</script>

<svelte:head>
	<title>Juega gratis a GeoGuessr</title>
</svelte:head>

<GetStarted
	imgName="get_started_spanish.jpg"
	ctaTitle="Es hora de empezar."
	ctaButton="Jugar ahora"
	content={[
		{
			heading: "La alternativa gratuita a GeoGuessr.",
			paragraph: `Te espera un emocionante viaje por la geografía. Con OpenGuessr, puedes recorrer el mundo sin pagar ni un
		céntimo. Basado en Street View real, sumérgete en el juego de adivinanzas geográficas más grande, completamente
		ilimitado y gratuito. No necesitas cuenta.`,
		},
		{
			heading: "Sin muros de pago, en ningún sitio.",
			paragraph: `«Open» forma parte del nombre por algo: ningún modo, función o aspecto del juego está bloqueado tras un muro de
		pago, todo está abierto para que lo explores. Financiado con ventajas para patrocinadores que otorgan cosméticos,
		pequeñas mejoras y una experiencia sin anuncios.`,
		},
		{
			heading: "Mapas que te pueden gustar.",
			paragraph: `Empieza una partida directamente en el mapa que elijas. Aquí hemos elegido algunos que pueden encajar contigo y
		tu idioma. Contienen ubicaciones desde la Sagrada Familia hasta el Ángel de la Independencia, ¿te animas a probar
		uno?`,
		},
		{
			heading: "La mejor forma de jugar gratis.",
			paragraph: `Observa el panorama, coloca el marcador y confirma tu respuesta para descubrir dónde estás: OpenGuessr es la
		experiencia gratuita de adivinanzas geográficas que estabas buscando. Únete a tus amigos en multijugador,
		enfréntate en duelos o mide tu nivel contra otros en competiciones.`,
			paragraph2: `Si prefieres explorar en solitario, te esperan decenas de miles de mapas, un mapa del mundo que se regenera
		automáticamente y un modo blink integrado. Pon un temporizador o juega a tu ritmo. Para principiantes, Country
		Guessr y Meta Guessr te ayudan a avanzar rápido, y OpenGuessr Education pone el conocimiento de los jugadores
		profesionales a tu alcance.`,
		},
	]}
	maps={["Best of Spain", "Urban Mexico", "Spanish Countries"]}
/>
