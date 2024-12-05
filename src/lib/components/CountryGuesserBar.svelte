<script>
  import { countryGuesser, multiplayer, competition } from "$lib/stores/modeStore";
  import { selectedCountryField } from "$lib/stores/context-specific/countryGuesserStore";
  import { playSound } from "$lib/utils/soundManager";
  import { confirmButtonActive } from "$lib/stores/context-specific/confirmButtonStore";
  import { confirmButtonClicks } from "$lib/utils/confirmButtonClick";

  function selectCountry(fieldNr) {
    playSound("item_select");
    selectedCountryField.set(fieldNr);
    confirmButtonActive.set(true);
  }

  function clickConfirm(event) {
    if (event.key === " ") {
      if ($confirmButtonActive) {
        confirmButtonClicks();
      } else {
        console.warn("Cannot click on confirm button - pointer events is none.");
      }
    }
  }
</script>

{#if $countryGuesser && !$multiplayer && !$competition}
  <div id="countryGuesserSelector" onkeyup={clickConfirm} role="menu" tabindex="0">
    <button
      class="countryGuesserHolder"
      class:selectedCountry={$selectedCountryField == 1}
      onclick={() => {
        selectCountry(1);
      }}
    >
      <p id="countryFlag1" class="countryGuesserFlag">🇦🇽</p>
      <p id="countryTag1" class="countryGuesserTag">Country 1</p>
    </button>
    <button
      class="countryGuesserHolder"
      class:selectedCountry={$selectedCountryField == 2}
      onclick={() => {
        selectCountry(2);
      }}
    >
      <p id="countryFlag2" class="countryGuesserFlag">🇦🇽</p>
      <p id="countryTag2" class="countryGuesserTag">Country 2</p>
    </button>
    <button
      class="countryGuesserHolder"
      class:selectedCountry={$selectedCountryField == 3}
      onclick={() => {
        selectCountry(3);
      }}
    >
      <p id="countryFlag3" class="countryGuesserFlag">🇦🇽</p>
      <p id="countryTag3" class="countryGuesserTag">Country 3</p>
    </button>
    <button
      class="countryGuesserHolder"
      class:selectedCountry={$selectedCountryField == 4}
      onclick={() => {
        selectCountry(4);
      }}
    >
      <p id="countryFlag4" class="countryGuesserFlag">🇦🇽</p>
      <p id="countryTag4" class="countryGuesserTag">Country 4</p>
    </button>
    <button
      class="countryGuesserHolder"
      class:selectedCountry={$selectedCountryField == 5}
      onclick={() => {
        selectCountry(5);
      }}
    >
      <p id="countryFlag5" class="countryGuesserFlag">🇦🇽</p>
      <p id="countryTag5" class="countryGuesserTag">Country 5</p>
    </button>
    <button
      class="countryGuesserHolder"
      class:selectedCountry={$selectedCountryField == 6}
      onclick={() => {
        selectCountry(6);
      }}
    >
      <p id="countryFlag6" class="countryGuesserFlag">🇦🇽</p>
      <p id="countryTag6" class="countryGuesserTag">Country 6</p>
    </button>
  </div>
{/if}

<style>
  .countryGuesserHolder {
    position: relative;
    box-sizing: border-box;
    height: 85px;
    width: 150px;
    border-radius: 7px;
    background-color: rgba(174, 174, 174, 0.25);
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition:
      scale 250ms ease,
      filter 250ms ease;
    text-align: center;
  }

  :global(.selectedCountry) {
    border: solid 4px white;
  }

  .countryGuesserFlag {
    font-size: 50px;
    margin-bottom: auto;
    margin-top: 10px;
    width: 100%;
    line-height: 0.7;
  }

  .countryGuesserHolder:hover {
    scale: 1.03;
    filter: brightness(1.3);
  }

  .countryGuesserTag {
    margin-top: auto;
    margin-bottom: 5px;
    font-size: 22px;
    color: white;
    width: 100%;
  }

  #countryGuesserSelector {
    position: fixed;
    bottom: 115px;
    margin-inline: auto;
    display: flex;
    gap: 8px;
    background-color: var(--panel-color);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 8px;
    pointer-events: auto;
    flex-wrap: wrap;
    justify-content: space-between;
    z-index: 10;
  }

  @media (orientation: portrait) and (max-width: 800px) {
    #countryGuesserSelector {
      bottom: 135px;
    }
  }

  @media all and (max-width: 1200px) {
    .countryGuesserFlag {
      font-size: 25px;
    }

    .countryGuesserTag {
      font-size: 18px;
    }

    .countryGuesserHolder {
      height: 75px;
      width: 31%;
      border-radius: 7px;
      flex-grow: 1;
    }

    #countryGuesserSelector {
      min-width: calc(100% - 40px);
      margin-inline: 10px;
    }
  }
</style>
