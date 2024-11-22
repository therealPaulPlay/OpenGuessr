<script>
  import Popup from "$lib/components/Popup.svelte";
  import { errorPopup } from "$lib/utils/errorHandling";
  import { loadAndInitializeLibrary } from "$lib/utils/scriptLoader";
  import { showConfirmPopup } from "$lib/utils/confirmPopup";
  import { initializeRewardedAd } from "$lib/utils/rewardedAds";
  import {
    isAuthenticated,
    supporterLevel,
    supportedAmount,
    freeSupporterBoostEnabled,
  } from "$lib/stores/accountStore";
  import { supporterPopupVisible } from "$lib/stores/context-specific/supporterPopupStore";
  import { onMount } from "svelte";
  import { playSound } from "$lib/utils/soundManager";

  const basePrices = [2.99, 6.99, 14.99, 24.99];

  function closeSupporterWindow() {
    supporterPopupVisible.set(false);
  }

  function getTierPrice(tier) {
    if ($supporterLevel >= tier) return "Unlocked";
    if ($supporterLevel == 0) return basePrices[tier - 1] + " $";

    return `<span class="baseTierPrice">${basePrices[tier - 1]} $</span>${Math.round(Math.max(basePrices[tier - 1] - $supportedAmount - 0.01, 0) * 100) / 100} $`;
  }

  // Initialize Stripe
  const stripeLivePubKey =
    "pk_live_51Ple5q1DTHjmMID9LrSuKNuwlN0Ls0issp2PTRO9QWGPdmKpLspMUXvKZQnXtHT5u0SxYZDBVSDsadzy3lAq5T2j00X9uGEJdr";

  let stripe;

  // Load stripe
  async function getStripe() {
    stripe = await loadAndInitializeLibrary("https://js.stripe.com/v3/", "Stripe", (Stripe) =>
      Stripe(stripeLivePubKey),
    );

    return stripe;
  }

  // Function to handle buy button click
  async function handleBuyClick(productId) {
    if (!stripe) {
      await getStripe();
    }

    try {
      // Fetch the current user's ID (you need to implement this based on your authentication system)
      const id = localStorage.getItem("id");

      // Call the server to create a Checkout Session
      const response = await fetch("https://accounts.openguessr.com/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("bearer"),
        },
        body: JSON.stringify({ productId, id }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (result.error) {
        console.error("Error occured during request to stripe:", result.error.message);
        errorPopup(
          "Stripe request failed",
          "The server returned an error from your purchase request.",
          error,
          false,
          false,
        );
      }
    } catch (error) {
      console.error("Error occured when trying to send request to stripe:", error);
      errorPopup("Error sending stripe request", "Your purchase request couldn't be sent.", error, false, false);
    }
  }

  function startPurchase(productId) {
    handleBuyClick(productId);
    playSound("basic_button");
  }

  // Thank you window after purchase for stripe
  onMount(() => {
    let urlParams = new URLSearchParams(window.location.search);

    let stripeSessionFinished;

    try {
      stripeSessionFinished = urlParams.get("session_id");
      if (stripeSessionFinished) {
        showConfirmPopup(
          "Thank you!",
          "You are now a supporter - thank you for your contribution! Supporters like you keep the game free and open for everyone.",
          false,
          false,
          false,
          true,
        );
        history.replaceState({}, document.title, window.location.pathname); //reset query in the address bar
      }
    } catch {}
  });

  // Free ad-supported experience boost --------------------------------------------------------------------------

  let freeSupporterBoostButton = $state();

  function supporterBoostAdDismiss(adNotAvailable, rewardClaimed) {
    if (adNotAvailable) {
      errorPopup("No ad available", "Please try again later or disable Ad Blockers.", "No ads", false, false);
    } else {
      if (!rewardClaimed) {
        errorPopup("Ad dismissed", "Video ad dismissed. ", "", false, true);
      }
    }
  }

  function enableSupporterAdBoost() {
    startAdSupporterTimer();
    $freeSupporterBoostEnabled = true;
  }

  let freeSupporterBoostText = $state();
  let boostTimerRunning = $state(false);

  $effect(() => {
    if (!boostTimerRunning) {
      freeSupporterBoostText = $freeSupporterBoostEnabled
        ? "Experience boost activated."
        : "Free 20% experience boost.";
    }
  });

  async function startAdSupporterTimer(prefix = "Boost active. Remaining: ") {
    boostTimerRunning = true;
    let t = 180;

    function timer() {
      let timeText = t > 59 ? Math.floor(t / 60) + ":" + (t % 60).toString().padStart(2, "0") + " min" : t + "s";
      freeSupporterBoostText = prefix + timeText;

      if (t > 0) {
        setTimeout(timer, 1000);
        t--;
      } else {
        $freeSupporterBoostEnabled = false;
        boostTimerRunning = false;
        showConfirmPopup(
          "Boost expired",
          "Your free experience boost has expired. Do you want to reactivate it?",
          () => {
            initializeRewardedAd(supporterBoostAdDismiss, enableSupporterAdBoost);
          },
          false,
          false,
          false,
          "Reactivate",
          "#588e6b",
        );
      }
    }

    timer();
  }
</script>

{#if $supporterPopupVisible}
  <Popup z="971" slim="true">
    <div class="popup-title">
      <h1 class="shiftTitle">
        Supporter Tiers
        <img id="supporterIconTitle" alt="supporter tag" src="/img/supporter_icon.png" />
      </h1>
    </div>
    <div id="supporterTierScrollBox" class="supporterBox supporterBoxFlex">
      <div id="adTierBox" class="adTierBox supporterArea" class:adTierBoxDisabled={$freeSupporterBoostEnabled}>
        <img alt="time limited" id="adBoostTimeLimitIcon" src="/img/time_limited.png" />
        <p id="freeSupporterBoostText" bind:textContent={freeSupporterBoostText} contenteditable="false"></p>
        <button
          id="freeSupporterBoost"
          class="standardButton"
          class:freeSupporterBoostDisabled={$freeSupporterBoostEnabled}
          bind:this={freeSupporterBoostButton}
          onclick={() => {
            playSound("basic_button");
            initializeRewardedAd(supporterBoostAdDismiss, enableSupporterAdBoost);
          }}>Watch ad to activate</button
        >
      </div>
      <div class="tierBox">
        <p class="tierBoxTier">Tier 1</p>
        <ul class="tierBenefits">
          <li>Highlighted on leaderboards</li>
          <li>Supporter Icon in profile</li>
          <li>Special Supporter Pin</li>
          <li>Tier 1 Supporter Badge</li>
          <li>10% Supporter XP Boost</li>
        </ul>
        <button
          id="tierPrice1"
          class="standardButton tierBuyButton"
          onclick={() => startPurchase(1)}
          class:tierBuyButtonUnlocked={$supporterLevel >= 1}>{getTierPrice(1)}</button
        >
      </div>
      <div class="tierBox">
        <p class="tierBoxTier">Tier 2</p>
        <ul class="tierBenefits">
          <li>All previous benefits</li>
          <li>Ad-free experience</li>
          <li>Tier 2 Supporter Badge</li>
          <li>15% Supporter XP Boost</li>
        </ul>
        <button
          id="tierPrice2"
          class="standardButton tierBuyButton"
          onclick={() => startPurchase(2)}
          class:tierBuyButtonUnlocked={$supporterLevel >= 2}>{getTierPrice(2)}</button
        >
      </div>
      <div class="tierBox">
        <p class="tierBoxTier">Tier 3</p>
        <ul class="tierBenefits">
          <li>All previous benefits</li>
          <li>Tier 3 Supporter Badge</li>
          <li>20% Supporter XP Boost</li>
        </ul>
        <button
          id="tierPrice3"
          class="standardButton tierBuyButton"
          onclick={() => startPurchase(3)}
          class:tierBuyButtonUnlocked={$supporterLevel >= 3}>{getTierPrice(3)}</button
        >
      </div>
      <div class="tierBox">
        <p class="tierBoxTier">Tier 4</p>
        <ul class="tierBenefits">
          <li>All previous benefits</li>
          <li>Tier 4 Supporter Badge</li>
          <li>25% Supporter XP Boost</li>
        </ul>
        <button
          id="tierPrice4"
          class="standardButton tierBuyButton"
          onclick={() => startPurchase(4)}
          class:tierBuyButtonUnlocked={$supporterLevel >= 4}>{getTierPrice(4)}</button
        >
      </div>
      <div class="supporterBox supporterBoxHighlight">
        <img alt="info icon" class="infoIcon" src="/img/info_icon.png" />
        <p id="supporterInfoText">
          All purchases are one-time payments.
          <span class="supporterLegalText">
            <a href="/legal" target="_blank">Terms and conditions</a>
            apply.
          </span>
        </p>
      </div>
    </div>
    <button
      id="supporterClose"
      class="standardButton white closeButton"
      onclick={() => {
        playSound("basic_button");
        closeSupporterWindow();
      }}>Close</button
    >
  </Popup>
{/if}

<style>
  #freeSupporterBoost {
    background: linear-gradient(30deg, rgba(143, 168, 148, 0.5), rgba(168, 198, 175, 0.6));
    flex-grow: 1;
    border-radius: 4px;
    margin-right: 2px;
    border: none;
  }

  .freeSupporterBoostDisabled {
    opacity: 0.5;
    pointer-events: none;
  }

  #freeSupporterBoostText {
    flex-grow: 10;
    max-width: 75%;
    font-size: 22px;
  }

  #adTierBox {
    border-radius: 10px;
    margin: 0;
    background: rgb(80, 90, 91);
    transition:
      background-color 250ms ease,
      filter 250ms ease;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px;
    flex-wrap: wrap;
  }

  .adTierBoxDisabled {
    pointer-events: none;
    background: rgba(255, 255, 255, 0.1);
  }

  #supporterIconTitle {
    width: 40px;
    height: 40px;
    margin-left: 7px;
    vertical-align: -5px;
  }

  .tierBoxTier {
    background-color: rgba(41, 208, 91, 0.2);
    text-align: center;
    width: 120%;
    padding-top: 10px;
    padding-bottom: 10px;
    margin-bottom: 20px;
    margin-top: -10px;
  }

  .tierBenefits {
    padding-left: 30px;
    font-size: 22px;
    width: 90%;
    margin-bottom: 10px;
    min-height: 210px;
    width: 220px;
  }

  .tierBenefits li {
    margin-bottom: 15px;
  }

  .tierBuyButton {
    flex-grow: 1;
    background: linear-gradient(30deg, rgba(37, 201, 72, 0.5), rgba(25, 215, 70, 0.7));
    width: 100%;
    margin-bottom: 15px;
    border: none;
  }

  .shiftTitle {
    margin-left: 10px;
    margin-bottom: 20px;
  }

  :global(.baseTierPrice) {
    margin-right: 5px;
    color: rgba(255, 255, 255, 0.5);
    text-decoration: line-through;
  }

  :global(.tierBuyButtonUnlocked) {
    pointer-events: none;
    opacity: 0.5;
  }

  .tierBox {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 10px;
    padding-inline: 25px;
    overflow: hidden;
    flex-grow: 1;
    transition: filter 250ms ease;
    position: relative;
  }

  .tierBox:hover {
    filter: brightness(1.2);
  }

  .tierBox::before {
    animation: supporterGlintTierBox 5s 2s infinite;
    background: linear-gradient(90deg, #00ff1c00 1%, #cfffd754 50%, #c0ffcd00);
    border-radius: inherit;
    content: "";
    height: 4px;
    inset: 0;
    opacity: 0;
    position: absolute;
    transform: translate(0);
    width: 50%;
    z-index: 1;
  }

  .supporterBoxFlex {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
    margin-top: 10px;
    max-height: calc(95dvh - 260px);
    overflow-x: hidden;
    overflow-y: auto;
    border-radius: 5px;
    border-radius: 5px;
  }

  .supporterBox {
    padding: 10px;
    width: calc(100% - 20px);
    border-radius: 10px;
  }

  .supporterBoxHighlight {
    background-color: rgba(255, 255, 255, 0.1);
    width: calc(100% - 30px);
    padding-inline: 15px;
    display: flex;
    align-items: center;
  }

  .supporterBox p {
    padding: 7px;
  }

  @keyframes supporterGlintTierBox {
    10% {
      opacity: 1;
    }

    20% {
      opacity: 0;
      transform: translate(100%);
    }

    21% {
      opacity: 0;
      transform: translate(100%, 342px);
    }

    30% {
      opacity: 1;
    }

    40% {
      opacity: 0;
      transform: translateY(342px);
    }

    41% {
      opacity: 0;
      transform: translate(0);
    }

    50% {
      opacity: 1;
    }

    60% {
      opacity: 0;
      transform: translate(100%);
    }
  }
</style>
