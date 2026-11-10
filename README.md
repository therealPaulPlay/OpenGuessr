![OpenGuessr logo](static/img/openguessr.svg)

# OpenGuessr

The free geography-guessing game. [Play OpenGuessr!](https://openguessr.com)

## Other parts

This is the main OpenGuessr repository. However, there are more parts that together form OpenGuessr.

### Core

- [openguessr-ui](https://github.com/therealPaulPlay/openguessr-ui): The OpenGuessr user interface design system.
- [openguessr-location-server](https://github.com/therealPaulPlay/openguessr-location-server): The live location generation server.
- openguessr-account-server: The main backend. *Currently closed-source for security purposes.*
- openguessr-native: Thin native wrappers. *Currently closed-source. It includes the Xcode and Android Studio configuration files.*
- [OpenGuessr Education](https://github.com/therealPaulPlay/OpenGuessrEducation) ([website](https://education.openguessr.com)): The educational side of OpenGuessr. Quizzes, articles, guides, and more.
- [Geometas](https://github.com/therealPaulPlay/geometas) ([website](https://geometas.com)): The educational meta-learning site. Also powers MetaGuessr and supplies metas to OpenGuessr Education.

### First-party libraries

- [PlaySocket](https://github.com/therealPaulPlay/PlaySocketJS) ([website](https://therealpaulplay.github.io/PlaySocketJS/)): The performant optimistic-first multiplayer library that powers OpenGuessr.
- [overfade](https://github.com/therealPaulPlay/overfade): A small utility that enables smoothly fading out the overflow in scroll containers.
- [fast-profanity-filter](https://github.com/therealPaulPlay/fast-profanity-filter): The profanity filter used in OpenGuessr.
- [headless-chat](https://github.com/therealPaulPlay/headless-chat): The chat system that powers the persistent messenger.

### Platforms built for OpenGuessr

- [OpenReport](https://github.com/therealPaulPlay/OpenReport) ([website](https://openreport.paulplay.studio)): The moderation platform used in OpenGuessr. Includes the mod dashboards and report forms.
- [Bugspot](https://github.com/therealPaulPlay/bugspot-ai) ([website](https://bugspot.dev)): An intelligent ai-enabled bug report platform used for collecting bugs.
- [Playlight](https://github.com/therealPaulPlay/Playlight-Site) ([website](https://playlight.dev)): A platform for recommending other high-quality web games.

### Noteworthy third-party libraries

- [Google Street View](https://developers.google.com/maps/documentation): Street View powers the 360-degree panoramas.
- [Leaflet](https://github.com/leaflet/Leaflet): Leaflet is used for various interactive maps.
- [Pannellum](https://github.com/mpetroff/pannellum): An alternative renderer for panoramas.
- [D3](https://github.com/d3/d3): A library for creating svg-based visualizations and maps, such as the community-map overview.

## Styling, icons, and text formatting

Please refer to the [`README.md` of `openguessr-ui`](https://github.com/therealPaulPlay/openguessr-ui#openguessr-ui).

## Getting involved

> [!NOTE]
> Using AI assistance for writing code is permitted, though PRs must have undergone thorough human review.
> Maintaining high code quality standards is integral to keeping the codebase pleasant to work with.

Contributions are welcome. Please refer to the `LICENSE.md` to learn how your contributions flow into the project.
To connect with the community, feel free to [join the Discord server](https://discord.com/invite/CSc3MbDrZ8), and if you have any questions, do not hesitate to contact me via this [contact form](https://paulplay.studio/contact).

If you like the project, giving it a star is highly appreciated! Thank you. ★★★

## Developing

OpenGuessr uses the incredible [Svelte](https://svelte.dev) as the framework. 

Once you've installed the dependencies with `npm install` (or `pnpm install`), start a development server using `npm run dev`.

### Linting

`ESlint` is used for linting. Use it via `npm run lint`.

### Building

To create a production build of OpenGuessr, run `npm run build`. You can preview the production build with `npm run preview`.

> To deploy the app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
