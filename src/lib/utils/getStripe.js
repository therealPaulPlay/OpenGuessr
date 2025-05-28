import { loadIifeScript } from "./scriptLoader";

// Initialize Stripe
const stripeLivePubKey = "pk_live_51Ple5q1DTHjmMID9LrSuKNuwlN0Ls0issp2PTRO9QWGPdmKpLspMUXvKZQnXtHT5u0SxYZDBVSDsadzy3lAq5T2j00X9uGEJdr";
// const stripeTestPubKey = "pk_test_51Ple5q1DTHjmMID9JDDStdV8VeFdfqVZMpGKFMaCrFD6WioMuoAuWzl9Odz25aJvw3L4tHVtzLrdNUFG34gH5pN300ZhIcpIID";

// Load stripe
export async function getStripe() {
    const stripe = await loadIifeScript("https://js.stripe.com/v3/", "Stripe", (Stripe) =>
        Stripe(stripeLivePubKey),
    );
    return stripe;
}