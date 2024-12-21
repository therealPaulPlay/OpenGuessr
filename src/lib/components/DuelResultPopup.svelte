<script>
  import Popup from "$lib/components/Popup.svelte";
  import { duelResultPopup } from "$lib/stores/uiStore";
  import { eloChange } from "$lib/stores/context-specific/duelResultStore";
  import DuelDivisionDisplay from "$lib/components/DuelDivisionDisplay.svelte";
  import { playSound } from "$lib/utils/soundManager";
  import { elo } from "$lib/stores/accountStore";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  // Animate number starting from 0
  const animatedElo = tweened(0, {
    duration: 2000,
    easing: cubicOut,
  });

  $effect(() => {
    animatedElo.set($eloChange);
  });
</script>

{#if $duelResultPopup}
  <Popup slim={true}>
    <div class="popup-title">
      <h1 id="socialHeader">Division</h1>
      <div class="eloChangeDisplay">
        <p class="eloChangeText">{$eloChange >= 0 ? "+" : ""}{$animatedElo.toFixed(0)} Elo</p>
        <p>You now have {$elo} Elo.</p>
      </div>
      <DuelDivisionDisplay />
    </div>
    <button
      class="standardButton closeButton white"
      onclick={() => {
        playSound("basic_button");
        duelResultPopup.set(false);
      }}>Close</button
    >
  </Popup>
{/if}

<style>
  .eloChangeDisplay {
    width: 100%;
    height: 100px;
    margin-bottom: 15px;
    margin-top: 15px;
    display: flex;
    border-radius: 15px;
    background-color: var(--box-color);
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .eloChangeText {
    width: 100%;
    text-align: center;
    font-size: 45px;
  }
</style>
