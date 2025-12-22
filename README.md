# OpenGuessr

The free location guessing game.

## Framework

OpenGuessr now uses [Svelte](https://svelte.dev). 

## CSS

The app.css file contains a bunch of default styles. Only if there is **no applicable predefined class**, create a new 
one inside of a component or page. For example, use the classes standardButton and white for a regular, white button. Make sure to use the CSS variables for common margins, such as `--box-margin` for the margin of a regular container. 

## Text formatting

Body text and headings should be written as plain sentences, without random capitalization (for example, “This is a nice location” rather than “This is a nice Location”).

Official map names, competition names, tournament names, and the names of other user-creatable game elements should capitalize each word (for example, “Urban Competition”). However, when users create their own content, they are free to choose their own capitalization and formatting.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Make sure to use the ```--host ``` option for the vite dev command, otherwise WebRTC won't work.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
