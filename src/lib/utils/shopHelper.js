import { isAuthenticated, purchasedPins, tokens } from "$lib/stores/accountStore";
import { showNotification } from "./notifications";
import { showConfirmPopup } from "./confirmPopup";
import { signupPrompt } from "./signupPrompt";
import { get } from "svelte/store";
import { accountUrl } from "$lib/stores/context-specific/apiConfigStore";
import { specialOfferLoadingText, specialOfferPins, specialOfferPrice, specialOfferRarity } from "$lib/stores/context-specific/shopStore";
import { errorPopup } from "./errorHandling";

export function handleShopPurchase(type = "pin", price, pinId) {
    if (!get(isAuthenticated)) return signupPrompt();
    if (price > get(tokens)) {
        showNotification("Not enough tokens!");
    } else {
        showConfirmPopup("Purchase?", `Do you want to purchase this item for ${price?.toLocaleString()} tokens?`, () => (sendPurchaseRequest(type, price, pinId)));
    }
}

async function sendPurchaseRequest(type, price, pinId) {
    if (type == "pin") {
        if (!pinId) return console.error("No pinId provided!");
        try {
            const response = await fetch(
                get(accountUrl) + `/shop/purchase-pin`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${localStorage.getItem("bearer")}`
                    },
                    body: JSON.stringify({
                        id: localStorage.getItem("id"),
                        pinId,
                    })
                },
            );

            if (!response.ok) throw new Error(response.status);

            tokens.set(get(tokens) - price);
            purchasedPins.set([...get(purchasedPins), pinId]);
            showPurchaseCelebration();
            fetchSpecialOffer(); // Re-fetch in case price was updated

        } catch (error) {
            console.error("Error purchasing pin:", error);
            errorPopup("Error purchasing pin", "An error occured purchasing a pin.", error);
        }
    } else if (type == "bundle") {
        try {
            const response = await fetch(
                get(accountUrl) + `/shop/purchase-bundle`,
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
            tokens.set(get(tokens) - price);
            purchasedPins.set([...get(purchasedPins), ...(data.pinsAdded || [])]);
            showPurchaseCelebration();
            fetchSpecialOffer(); // Re-fetch to set status to owned

        } catch (error) {
            console.error("Error purchasing bundle:", error);
            errorPopup("Error purchasing bundle", "An error occured purchasing a bundle.", error);
        }
    }
}

function showPurchaseCelebration() {

}

export async function fetchSpecialOffer() {
    try {
        const response = await fetch(
            get(accountUrl) + `/shop/bundle${get(isAuthenticated) ? "?user-id=" + localStorage.getItem("id") : ""}`,
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