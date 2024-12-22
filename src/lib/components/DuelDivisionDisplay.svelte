<script>
  import { calculateDivision } from "$lib/utils/rankedDuels";
  import { elo } from "$lib/stores/accountStore";

  // Divisions
  let fillPercentage = $derived.by(() => {
    const value = $elo;
    if (value <= 1000) return 0;
    if (value <= 1200) return (value - 1000) * (25 / 200); // 0-25%
    if (value <= 1400) return 25 + (value - 1200) * (25 / 200); // 25-50%
    if (value <= 1600) return 50 + (value - 1400) * (25 / 200); // 50-75%
    if (value <= 2000) return 75 + (value - 1600) * (25 / 400); // 75-100%
    return 100;
  });

  let currentDivision = $derived(calculateDivision($elo));

  const divisions = ["I", "II", "III", "IV", "V"].reverse();
  const circlePositions = [0, 25, 50, 75, 100];
</script>

<div class="progressContainer">
  <div class="progressBarWrapper">
    <div class="progressBar">
      <div class="progressBarFill" style="width: {fillPercentage}%"></div>
    </div>

    {#each divisions as division, index}
      <div class="divisionMarker" style="left: {circlePositions[index]}%">
        <div class="divisionCircle" class:activeDivision={4 - index === currentDivision}>
          <div class="divisionCircleBackground"></div>
          <span class="divisionText">{division}</span>
        </div>
      </div>
    {/each}

    {#if fillPercentage > 0 && fillPercentage < 100}
      <div class="eloIndicator" style="left: {fillPercentage}%">
        <div class="eloLine"></div>
        <div class="eloValue">{Math.round($elo)} ELO</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .progressContainer {
    position: relative;
    width: calc(100% - 50px);
    height: 100px;
    border-radius: 15px;
    background-color: var(--box-color);
    padding-inline: 25px;
    margin-bottom: 15px;
  }

  .progressBarWrapper {
    position: relative;
    width: calc(100% - 60px);
    margin: 0 30px;
    height: 100%;
  }

  .progressBar {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 100%;
    height: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    overflow: hidden;
  }

  .progressBarFill {
    height: 100%;
    background: var(--brand-color);
    border-radius: 6px;
    transition: width 0.3s ease;
  }

  .divisionMarker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .divisionCircle {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .divisionCircleBackground {
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgb(114, 115, 119);
    border-radius: 50%;
  }

  .divisionText {
    color: white;
    z-index: 1;
    font-size: 22px;
    position: relative;
  }

  .eloIndicator {
    position: absolute;
    top: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 50%;
    z-index: -1;
  }

  .eloLine {
    width: 2px;
    height: 6px;
    background: var(--brand-color);
    margin-top: 15px;
    border-radius: 5px;
  }

  .eloValue {
    color: var(--brand-color);
    font-size: 18px;
    margin-top: 4px;
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.3);
    padding-inline: 2px;
  }

  .activeDivision {
    border: 3px solid rgba(255, 255, 255, 0.8);
  }

  @media (max-width: 800px) {
    .divisionCircle {
      width: 30px;
      height: 30px;
    }
  }
</style>
