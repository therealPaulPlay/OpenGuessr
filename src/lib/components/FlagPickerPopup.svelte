<script>
	import Popup from "$lib/components/ui/Popup.svelte";
	import { playSound } from "$lib/utils/soundManager";
	import { flagPickerPopup } from "$lib/stores/uiStore";
	import { profileData } from "$lib/stores/context-specific/profileStore";
	import * as FlagIcons from "svelte-flag-icons";
	import { setProfileFlag } from "$lib/utils/updateProfileData";
	import { Trash2 } from "lucide-svelte";

	// Organize flags by continent
	const continentFlags = {
		Europe: [
			"Ad",
			"Al",
			"At",
			"Ba",
			"Be",
			"Bg",
			"By",
			"Ch",
			"Cy",
			"Cz",
			"De",
			"Dk",
			"Ee",
			"Es",
			"EsCt",
			"EsGa",
			"EsPv",
			"Fi",
			"Fr",
			"Gb",
			"GbEng",
			"GbNir",
			"GbSct",
			"GbWls",
			"Gr",
			"Hr",
			"Hu",
			"Ie",
			"Is",
			"It",
			"Li",
			"Lt",
			"Lu",
			"Lv",
			"Mc",
			"Md",
			"Me",
			"Mk",
			"Mt",
			"Nl",
			"No",
			"Pl",
			"Pt",
			"Ro",
			"Rs",
			"Ru",
			"Se",
			"Si",
			"Sk",
			"Sm",
			"Ua",
			"Va",
			"Xk",
		],
		Asia: [
			"Ae",
			"Af",
			"Am",
			"Az",
			"Bd",
			"Bh",
			"Bn",
			"Bt",
			"Cn",
			"Ge",
			"Hk",
			"Id",
			"Il",
			"In",
			"Iq",
			"Ir",
			"Jo",
			"Jp",
			"Kg",
			"Kh",
			"Kp",
			"Kr",
			"Kw",
			"Kz",
			"La",
			"Lb",
			"Lk",
			"Mm",
			"Mn",
			"Mo",
			"My",
			"Np",
			"Om",
			"Ph",
			"Pk",
			"Ps",
			"Qa",
			"Sa",
			"Sg",
			"Sy",
			"Th",
			"Tj",
			"Tl",
			"Tm",
			"Tw",
			"Uz",
			"Vn",
		],
		Africa: [
			"Ao",
			"Bf",
			"Bi",
			"Bj",
			"Bw",
			"Cd",
			"Cf",
			"Cg",
			"Ci",
			"Cm",
			"Cv",
			"Dj",
			"Dz",
			"Eg",
			"Er",
			"Et",
			"Ga",
			"Gh",
			"Gm",
			"Gn",
			"Gq",
			"Ke",
			"Lr",
			"Ls",
			"Ly",
			"Ma",
			"Mg",
			"Ml",
			"Mr",
			"Mu",
			"Mw",
			"Mz",
			"Na",
			"Ne",
			"Ng",
			"Rw",
			"Sd",
			"Sl",
			"Sn",
			"So",
			"St",
			"Sz",
			"Td",
			"Tg",
			"Tn",
			"Tz",
			"Ug",
			"Za",
			"Zm",
			"Zw",
		],
		"North America": [
			"Ag",
			"Bb",
			"Bm",
			"Bs",
			"Bz",
			"Ca",
			"Cr",
			"Cu",
			"Dm",
			"Do",
			"Gd",
			"Gt",
			"Hn",
			"Ht",
			"Jm",
			"Kn",
			"Lc",
			"Mx",
			"Ni",
			"Pa",
			"Sv",
			"Tt",
			"Us",
			"Vc",
		],
		"South America": ["Ar", "Bo", "Br", "Cl", "Co", "Ec", "Gy", "Pe", "Py", "Sr", "Uy", "Ve"],
		Oceania: ["Au", "Fj", "Fm", "Ki", "Mh", "Nr", "Nu", "Nz", "Pg", "Pw", "Sb", "To", "Tv", "Vu", "Ws"],
		Unassigned: [
			"Ck", // Cook Islands
			"Gw", // Guinea-Bissau
			"Km", // Comoros
			"Mv", // Maldives
			"Sc", // Seychelles
			"Ss", // South Sudan
			"Tr", // Turkey
			"Ye", // Yemen
		],
	};

	function handleFlagClick(countryCode, buttonSound = false) {
		// Update profile data with selected flag
		if (!buttonSound) playSound("item_select");
		if (buttonSound) playSound("basic_button");
		if ($profileData?.flag == countryCode) {
			// If this is the selected flag, remove it
			handleFlagClick(null, true);
			return;
		}
		setProfileFlag(countryCode);
		profileData.update((data) => {
			return { ...data, flag: countryCode };
		});
	}
</script>

{#if $flagPickerPopup}
	<Popup z={971} verySlim={true}>
		<div class="popup-title">
			<h1 id="pinPopupWindow">Flags</h1>
		</div>
		<div class="flag-container">
			{#each Object.entries(continentFlags) as [continent, countries]}
				<div class="continent-section">
					<p class="continentTitle">{continent}</p>
					<div class="flagSelector">
						{#each countries as countryCode}
							{#if FlagIcons[countryCode]}
								<button
									class="flagButton"
									onclick={() => handleFlagClick(countryCode)}
									title={countryCode}
									class:flagSelected={$profileData?.["flag"] == countryCode}
								>
									<svelte:component this={FlagIcons[countryCode]} />
								</button>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<button
			class="standardButton white closeButton"
			onclick={() => {
				playSound("basic_button");
				flagPickerPopup.set(false);
			}}
		>
			Close
		</button>
	</Popup>
{/if}

<style>
	.flag-container {
		max-height: calc(90dvh - 250px);
		overflow-y: auto;
		padding: 0 10px;
	}

	.continentTitle {
		padding: 3px;
		background-color: var(--box-color);
		border-radius: 10px;
		text-align: left;
		padding-left: 10px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
	}

	.continent-section {
		margin-bottom: var(--layout-margin);
	}

	.flagSelected {
		outline: 3px solid rgba(255, 255, 255, 0.75);
		border-radius: 3px;
		background-color: rgba(255, 255, 255, 0.2) !important;
	}

	.flagSelector {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		width: fit-content;
		margin-left: 0;
		padding: var(--box-margin-buttons);
		min-width: calc(100% - 16px);
		background-color: var(--box-color-dark);
		border-radius: 10px;
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		gap: 10px;
		flex-wrap: wrap;
	}

	.flagButton {
		background: none;
		border: none;
		cursor: pointer;
		padding: 5px;
		transition: transform 250ms;
		width: 40px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.flagButton:hover {
		transform: scale(1.1);
	}

	:global(.flagButton svg) {
		width: 100%;
		height: 100%;
	}
</style>
