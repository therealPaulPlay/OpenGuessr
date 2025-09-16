import { isAuthenticated, purchasedPins, tokens } from "$lib/stores/accountStore";
import { showNotification } from "./notifications";
import { showConfirmPopup } from "./confirmPopup";
import { signupPrompt } from "./signupPrompt";
import { get } from "svelte/store";
import { apiUrl } from "$lib/stores/context-specific/apiConfigStore";
import { freeDailyTokensClaimed, shopAnimationImages, shopPurchaseAnimation, shopPurchaseAnimationTitle, specialOfferLoadingText, specialOfferPins, specialOfferPrice, specialOfferRarity } from "$lib/stores/context-specific/shopStore";
import { errorPopup } from "./errorHandling";
import { getStripe } from "./getStripe";

export function handleShopPurchase(type = "pin", price, pinId, bundleItems) {
    if (!get(isAuthenticated)) return signupPrompt();
    if (price > get(tokens)) {
        showNotification("Not enough tokens!");
    } else {
        showConfirmPopup("Purchase?", `Do you want to purchase this item for ${price?.toLocaleString()} tokens?`, () => (sendPurchaseRequest(type, price, pinId, bundleItems)));
    }
}

export async function handleShopFreeTokens() {
    try {
        const response = await fetch(get(apiUrl) + "/shop/claim-free-tokens",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${localStorage.getItem("bearer")}`
                },
                body: JSON.stringify({
                    id: localStorage.getItem("id")
                })
            },
        );

        if (!response.ok) throw new Error(response.status);
        const data = await response.json();
        tokens.set(get(tokens) + data.count);
        freeDailyTokensClaimed.set(true);
        shopAnimationImages.set(["/img/token_stack_free_icon.png"]);
        shopPurchaseAnimationTitle.set("Cool!");
        shopPurchaseAnimation.set(true);

    } catch (error) {
        console.error("Error claiming tokens:", error);
        errorPopup("Error claiming tokens", "An error occured claiming tokens.", error);
    }
}

export async function handleShopYouTubePin() {
    try {
        const response = await fetch(get(apiUrl) + "/shop/claim-youtube-pin",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${localStorage.getItem("bearer")}`
                },
                body: JSON.stringify({
                    id: localStorage.getItem("id")
                })
            },
        );

        if (!response.ok) throw new Error(response.status);
        const data = await response.json();
        purchasedPins.set([...get(purchasedPins), data.pinId]); // Add pin to locally-stored purchased pins
        showPurchaseCelebration([data.pinId], "Thank you!");

    } catch (error) {
        console.error("Error claiming pin:", error);
        errorPopup("Error claiming pin", "An error occured claiming a pin.", error);
    }
}

export async function shopPurchaseTokenTier(tier) {
    const stripe = await getStripe();
    const productId = "token_tier_" + tier;

    try {
        const id = localStorage.getItem("id");

        // Call the server to create a Checkout Session
        const response = await fetch(get(apiUrl) + "/stripe/create-checkout-session", {
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

        if (result.error) throw new Error(result.error);
    } catch (error) {
        console.error("Error occured during checkout:", error);
        errorPopup("Checkout error", "An error occured trying to create a checkout session.", error, false, false);
    }
}

async function sendPurchaseRequest(type, price, pinId, bundleItems) {
    if (type == "pin") {
        if (!pinId) return console.error("No pinId provided!");
        try {
            const response = await fetch(get(apiUrl) + "/shop/purchase-pin",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${localStorage.getItem("bearer")}`
                    },
                    body: JSON.stringify({
                        id: localStorage.getItem("id"),
                        pinId
                    })
                },
            );

            if (!response.ok) {
                let error = response.status;
                try {
                    const data = await response.json();
                    if (data.error) error = data.error;
                } catch { }
                throw new Error(error);
            }

            tokens.set(get(tokens) - price);
            purchasedPins.set([...get(purchasedPins), pinId]);
            showPurchaseCelebration([pinId]);
            fetchSpecialOffer(); // Re-fetch in case price was updated

        } catch (error) {
            console.error("Error purchasing pin:", error);
            errorPopup("Error purchasing pin", "An error occured purchasing a pin.", error);
        }
    } else if (type == "bundle") {
        try {
            const response = await fetch(
                get(apiUrl) + `/shop/purchase-bundle`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${localStorage.getItem("bearer")}`
                    },
                    body: JSON.stringify({
                        id: localStorage.getItem("id"),
                        bundleItems
                    })
                },
            );

            if (!response.ok) {
                let error = response.status;
                try {
                    const data = await response.json();
                    if (data.error) error = data.error;
                } catch { }
                throw new Error(error);
            }

            const data = await response.json();
            tokens.set(get(tokens) - price);
            purchasedPins.set([...get(purchasedPins), ...(data.pinsAdded || [])]);
            showPurchaseCelebration(data.pinsAdded);
            fetchSpecialOffer(); // Re-fetch to set status to owned

        } catch (error) {
            console.error("Error purchasing bundle:", error);
            errorPopup("Error purchasing bundle", "An error occured purchasing a bundle.", error);
        }
    }
}

function showPurchaseCelebration(pinIds, title = "Great choice!") {
    const imageSrcArray = [];
    pinIds?.forEach((id) => {
        imageSrcArray.push(`/img/pins/player_pin${id}.png`);
    });
    shopAnimationImages.set(imageSrcArray);
    shopPurchaseAnimationTitle.set(title);
    shopPurchaseAnimation.set(true);
}

export async function fetchSpecialOffer() {
    specialOfferLoadingText.set("Loading...");
    try {
        const response = await fetch(get(apiUrl) + `/shop/bundle${get(isAuthenticated) ? "?user-id=" + localStorage.getItem("id") : ""}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        if (response.ok) {
            const data = await response.json();
            specialOfferPins.set(data.pins);
            specialOfferRarity.set(data.rarity);
            specialOfferPrice.set(data.price);
        } else {
            throw new Error(response.status);
        }
    } catch (error) {
        console.error("Error loading special offer:", error);
        specialOfferLoadingText.set("Error: " + error.message);
    }
}