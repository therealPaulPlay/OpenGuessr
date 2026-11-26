import { get } from "svelte/store";
import {
  appStoreUrl,
  discordInviteUrl,
  gitHubUrl,
  playStoreUrl,
  redditUrl,
  youTubeUrl,
} from "$lib/stores/context-specific/apiConfigStore";
import { faq } from "$lib/stores/context-specific/faqStore";

export function load() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        name: "OpenGuessr",
        url: "https://openguessr.com",
        description:
          "OpenGuessr is the free geo-guessing game. Guess where a panorama image was taken and learn geography through play.",
        image: "https://openguessr.com/img/og-image.jpg",
        genre: ["Geography", "Educational"],
        isAccessibleForFree: true,
        publisher: { "@type": "Organization", name: "PaulPlay Studio", url: "https://paulplay.studio" },
        sameAs: [
          get(gitHubUrl),
          get(discordInviteUrl),
          get(redditUrl),
          get(youTubeUrl),
          get(playStoreUrl),
          get(appStoreUrl),
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: get(faq).map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };

  return {
    structuredData: `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`,
  };
}
