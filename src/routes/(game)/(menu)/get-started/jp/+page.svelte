<script>
	import GetStarted from "$lib/components/GetStarted.svelte";
</script>

<svelte:head>
	<title>GeoGuessrを無料で始めよう</title>
</svelte:head>

<GetStarted
	imgName="get_started_japanese.jpg"
	ctaTitle="さあ、始めましょう。"
	ctaButton="今すぐプレイ"
	content={[
		{
			heading: "GeoGuessrの無料代替ゲーム。",
			paragraph: `ワクワクする地理の旅があなたを待っています。OpenGuessrなら、お金をかけずに世界中を旅できます。実際のStreet
		Viewをもとにした、最大級の完全無制限＆無料の地理当てゲームに没頭しましょう。アカウント登録も不要です。`,
		},
		{
			heading: "ペイウォールは一切なし。",
			paragraph: `名前に「Open」と付いているのには理由があります。どのモードも機能も遊び方も、課金の壁に隠れていません。すべてがあなたに開かれています。運営資金は、装飾アイテムやちょっとした特典、広告非表示などのサポーター特典によって賄われています。`,
		},
		{
			heading: "おすすめのマップ。",
			paragraph: `好きなマップを選んですぐにゲームを始められます。ここでは、あなたにぴったりかもしれないマップをいくつかピックアップしました。東京タワーから厳島神社まで、さまざまな場所が登場します。さっそく飛び込んでみますか？`,
		},
		{
			heading: "無料で遊ぶなら、これが一番。",
			paragraph: `パノラマを眺めて、ピンを置いて、回答を確定すれば、自分がどこにいるのかが明らかになります。OpenGuessrは、あなたが探していた無料の地理当て体験です。マルチプレイで友達と協力したり、デュエルで真剣勝負したり、大会でほかのプレイヤーと実力を競ったりできます。`,
			paragraph2: `ひとりでじっくり探索したいなら、数万ものマップ、自動で再生成されるワールドマップ、そして便利なブリンクモードが待っています。タイマーをセットしてもいいし、自分のペースで遊んでもOK。初心者にはCountry
		GuessrやMeta Guessrが上達の近道になり、OpenGuessr
		Educationならプロプレイヤーの知識にいつでも触れられます。`,
		},
	]}
	maps={["Towns of Japan", "Japan Famous Places", "Japan Shrines"]}
/>
