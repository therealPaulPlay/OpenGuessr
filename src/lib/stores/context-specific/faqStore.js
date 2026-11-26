import { readable } from "svelte/store";

export const faq = readable([
    {
        question: "What is OpenGuessr?",
        answer: "OpenGuessr is the free geo-guessing game that takes you all around the world! You are dropped in a Street View panorama, look for clues, and guess where you are by placing a pin on the world map.",
    },
    {
        question: "Is OpenGuessr really free?",
        answer: "Yes, with no round or time limit. No single bit of gameplay is locked behind a paywall and purchases mostly unlock cosmetics.",
    },
    {
        question: "How can I play GeoGuessr for free?",
        answer: "GeoGuessr's free version is very limited. OpenGuessr is a free GeoGuessr alternative with the same idea of guessing the location of a panorama, but without a subscription or limits.",
    },
    {
        question: "Is OpenGuessr the same as GeoGuessr?",
        answer: "No, not quite. OpenGuessr is a distinct game and is not affiliated with GeoGuessr. It has the same core concept, guessing where a panorama was taken, but with no subscription and many unique game modes.",
    },
    {
        question: "Is an account required?",
        answer: "You can enjoy community maps, custom rooms to play with friends, and most parts of the game without one. For saving progress, competing in division duels or competitions, and progressing, an account comes in handy.",
    },
    {
        question: "Is there a limit on how much I can play?",
        answer: "No, it's 100% unlimited. There is absolutely no limit to how often or for how long you play.",
    },
    {
        question: "Can I play with friends?",
        answer: "Yes! Create a multiplayer room and share the room code with your friends (or add them on OpenGuessr). You can also chat with them via the in-game messenger, or take on other players in duels and 2v2s.",
    },
    {
        question: "Is OpenGuessr unblocked at school?",
        answer: "Usually, yes! It depends on your school's firewall, but with its educational focus through OpenGuessr Education and Geometas, OpenGuessr is usually not blocked.",
    },
    {
        question: "Does OpenGuessr work on my phone?",
        answer: "Yes, it runs in any mobile browser, and there are native apps for both Android and iOS!",
    },
    {
        question: "Does OpenGuessr use Google Street View?",
        answer: "Yes, it uses official Street View. Explore more than 100 countries with official coverage and even enjoy unofficial coverage through custom maps.",
    },
]);
