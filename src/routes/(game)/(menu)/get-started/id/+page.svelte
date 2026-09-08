<script>
	import GetStarted from "$lib/components/GetStarted.svelte";
</script>

<svelte:head>
	<title>Main GeoGuessr gratis sekarang</title>
</svelte:head>

<GetStarted
	imgName="get_started_indonesian.jpg"
	ctaTitle="Saatnya mulai bermain."
	ctaButton="Main sekarang"
	content={[
		{
			heading: "Alternatif GeoGuessr gratis.",
			paragraph: `Petualangan geografi seru menantimu. Dengan OpenGuessr, kamu bisa keliling dunia tanpa bayar sepeser pun.
		Berbasis Street View asli, rasakan pengalaman game tebak geografi terbesar yang benar-benar gratis dan tanpa batas.
		Tidak perlu akun.`,
		},
		{
			heading: "Tanpa paywall sama sekali.",
			paragraph: `Kata “Open” ada di nama kami bukan tanpa alasan — tidak ada mode, fitur, atau aspek permainan yang dikunci di
		balik paywall, semuanya terbuka untuk kamu jelajahi. Didukung oleh benefit pendukung yang memberikan kosmetik,
		bonus kecil, dan pengalaman bebas iklan.`,
		},
		{
			heading: "Peta yang mungkin kamu suka.",
			paragraph: `Mulai permainan langsung di peta pilihanmu. Di sini, kami sudah memilih beberapa yang mungkin cocok untukmu dan
		bahasamu. Ada lokasi dari Monas sampai Candi Borobudur, siap langsung terjun?`,
		},
		{
			heading: "Cara terbaik main gratis.",
			paragraph: `Lihat panoramanya, pasang pinmu, dan kunci tebakanmu untuk tahu kamu ada di mana — OpenGuessr adalah pengalaman
		tebak geografi gratis yang selama ini kamu cari. Main bareng teman di multiplayer, adu skill di duel, atau lihat
		seberapa hebat kamu dibanding pemain lain di kompetisi.`,
			paragraph2: `Kalau kamu lebih suka menjelajah sendirian, puluhan ribu peta, peta Dunia yang diperbarui otomatis, dan mode
		blink bawaan sudah menantimu. Atur timer, atau main dengan ritmemu sendiri. Untuk pemula, Country Guessr dan Meta
		Guessr membantumu berkembang cepat, dan OpenGuessr Education memberimu pengetahuan ala pemain pro dalam
		genggamanmu.`,
		},
	]}
	maps={["Indonesia Famous", "AI-Indonesia", "Indomaret Indonesia"]}
/>
