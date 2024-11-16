<script>
  import { supporterWindowIfAuthenticated } from "$lib/components/SupporterPopup.svelte";
  let { text } = $props();
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<p class="adsTextResult noAdvertsText">
  {text} <span class="supporterAdText" onclick={supporterWindowIfAuthenticated} role="button">Learn more</span>.
</p>

<style>
  .adsTextResult {
    outline: none;
    background-color: transparent;
    opacity: 0.5 !important;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
  }

  .noAdvertsText {
    text-align: center;
    color: white;
    opacity: 0.25;
    font-size: 22px;
    overflow: hidden;
    transition: opacity 500ms ease;
    border-radius: 7px;
    background-color: rgba(168, 168, 187, 0.3);
  }

  .supporterAdText {
    text-decoration: underline;
    cursor: pointer;
  }
</style>
