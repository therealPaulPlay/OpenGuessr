<script>
	import GetStarted from "$lib/components/GetStarted.svelte";
</script>

<svelte:head>
	<title>GeoGuessr kostenlos spielen</title>
</svelte:head>

<GetStarted
	imgName="get_started_german.jpg"
	ctaTitle="Zeit, loszulegen."
	ctaButton="Jetzt spielen"
	content={[
		{
			heading: "Die kostenlose GeoGuessr Alternative.",
			paragraph: `Ein spannendes Geografie-Abenteuer wartet auf dich. Mit OpenGuessr reist du um die Welt, ohne einen Cent zu
		zahlen. Basierend auf echtem Street View tauchst du ein in das größte, komplett unbegrenzte und kostenlose
		Geografie-Ratespiel. Kein Konto erforderlich.`,
		},
		{
			heading: "Keine Paywalls. Nirgends.",
			paragraph: `„Open“ steht nicht ohne Grund im Namen – kein Modus, kein Feature und kein Spielaspekt ist hinter einer Paywall
		versteckt, alles steht dir offen. Finanziert durch Supporter-Vorteile, die dir Kosmetik, kleine Boosts und ein
		werbefreies Erlebnis bieten.`,
		},
		{
			heading: "Karten, die dir gefallen könnten.",
			paragraph: `Starte direkt ein Spiel auf einer Karte deiner Wahl. Wir haben ein paar ausgesucht, die zu dir und deiner Sprache
		passen könnten. Sie enthalten Orte vom Brandenburger Tor bis zum Schloss Schönbrunn – bereit, reinzuspringen?`,
		},
		{
			heading: "Die beste Art, kostenlos zu spielen.",
			paragraph: `Schau dir das Panorama an, setze den Pin und bestätige deinen Tipp, um zu sehen, wo du bist – OpenGuessr ist das
		kostenlose Geografie-Rateerlebnis, nach dem du gesucht hast. Tu dich mit Freunden im Multiplayer zusammen, miss
		dich in Duellen oder sieh nach, wie du dich in Wettkämpfen gegen andere schlägst.`,
			paragraph2: `Wenn du lieber im Singleplayer erkundest, warten Zehntausende Karten, eine automatisch neu generierte Weltkarte
		und ein integrierter Blink-Modus auf dich. Stell einen Timer oder spiele in deinem eigenen Tempo. Für Einsteiger
		helfen dir Country Guessr und Meta Guessr, schnell besser zu werden, und OpenGuessr Education gibt dir Profi-Wissen
		direkt an die Hand.`,
		},
	]}
	maps={["Better Germany", "Austria Skiing", "Switzerland Hardcore"]}
/>
