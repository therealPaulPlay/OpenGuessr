<script>
  // This component displays the timer, mode, restrictions
  import {
    mapModeIndicatorVisible,
    modeText,
    leaveFunction,
    indicatorFading,
    timerText,
  } from "$lib/stores/context-specific/mapModeIndicatorStore";
</script>

{#if $mapModeIndicatorVisible}
  <div id="mapModeIndicator">
    {#if $leaveFunction}
      <button class="leaveButton standardButton closeButton {$indicatorFading ? 'fading' : ''}" onclick={leaveFunction}
        >Leave</button>
    {/if}
    <div id="mapModeTextContainer">
      <p class="mapModeText">{$modeText}</p>
    </div>
    <p id="mapTimer" class="mapModeText modeTextRight {$indicatorFading ? 'fading' : ''}">{$timerText}</p>
  </div>
{/if}

<style>
  #mapModeIndicator {
    pointer-events: auto;
    background-color: var(--panel-color);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 2px 20px rgba(5, 6, 10, 0.3);
    height: 48px;
    width: 100%;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    color: white;
    font-size: 22px;
    transition:
      width 250ms ease,
      margin 250ms ease;
    z-index: 10;
    margin-top: 10px;
    padding-top: 3px;
    padding-bottom: 2px;
    user-select: none;
    flex-shrink: 0;
  }

  @media (max-width: 1600px) {
    #mapModeIndicator {
      font-size: 20px;
    }
  }

  #mapModeIndicator.fading {
    animation: divFade 1s infinite;
  }

  .leaveButton {
    display: none;
    margin: 0;
    padding-inline: 10px;
    line-height: 0.9;
    margin-left: 8px;
    min-height: unset;
  }

  .mapModeText {
    white-space: nowrap;
    width: fit-content;
  }

  #mapModeTextContainer {
    margin-left: 10px;
    margin-right: 5px;
    overflow: hidden;
    flex-grow: 1;
  }

  .modeTextRight {
    margin-left: auto;
    margin-right: 25px;
  }

  @keyframes divFade {
    0% {
      background-color: var(--panel-color);
    }

    50% {
      background-color: hsla(298, 25%, 20%, 0.7);
    }

    100% {
      background-color: var(--panel-color);
    }
  }

  .modetextScroll {
    animation: scrollModeText 5s ease-in-out infinite alternate;
  }

  @keyframes textFade {
    0% {
      color: white;
    }

    50% {
      color: red;
    }

    100% {
      color: white;
    }
  }

  #mapTimer {
    text-align: right;
    min-width: 40px;
  }

  #mapTimer.fading {
    animation: textFade 1s infinite;
  }

  @keyframes scrollModeText {
    0% {
      transform: translateX(5px);
    }

    100% {
      transform: translateX(calc(-100% + 135px));
    }
  }
</style>
