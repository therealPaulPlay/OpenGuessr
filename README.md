![OpenGuessr logo](static/img/openguessr.svg)

# OpenGuessr

The free location guessing game.

## Framework

OpenGuessr uses [Svelte](https://svelte.dev). 

## Styling guidelines

The `app.css` file contains a bunch of classes. Only if there is **no applicable predefined class**, create a new 
one inside of a component or page. OpenGuessr uses a `CSS component library` approach for simple components, and only uses Svelte components for complex UI parts that require JS (in `/components/ui`).

As part of OpenGuessr's design philosophy, there's one important rule to follow:
**Margin, padding and border radius always match.** To make this system easy to follow, there are variables inside `app.css` with the values that should be used. 
> [!TIP]
> Exceptions can be made if an icon or text doesn't look properly aligned.

These variables follow a layered approach:

| Layer | Purpose | Variable | Value |
| ----- | ------- | -------- | ----- |
| 1 | Buttons, labels, text, in-button fields etc. | --content-margin | 5px |
| 2 | Floating panels, usually fixed to the viewport | --panel-margin | 8px |
| 3 | Containers inside popups or layout containers | --box-margin | 10px |
| 4 | Containers inside pages (not already in a 'box') | --layout-margin | 15px |
| 5 | Popups, sheets | calc(var(--layout-margin) + var(--box-margin)) | 25px |

This means that, for example, a conatiner on a menu page uses `--layout-margin` for the padding and border radius. It's children use `--box-margin` for both padding and border. The children of that inner box (e.g. buttons, standardButton already does) use `--content-margin`. This ensures that rounded corners, spacing etc. always looks consistent.

### Containers
Containers, referred to as boxes in the code base, usually need the following styles:
```css
.common-box {
    background-color: var(--box-color); /* Light white */
    border-radius: var(--box-margin);
    padding: var(--box-margin);
    gap: var(--box-margin); /* If flex or grid layout is used */
    box-shadow: var(--box-shadow);
}
``` 

Containers that contain text often look more well-rounded with `padding-inline: var(--layout-margin)` since the font naturally adds a bit of padding towards the top and bottom. This ensures better readability.

### Colors
Please refer to the color section in `app.css`, but the most important ones are:
- `--brand-color` The distinctive red
- `--panel-color` A more opaque dark blue used for UI floating above the panorama
- `--panel-color-soft` A slightly lighter version of the panel color, used when UI is overlayed above a dark background and the panorama
- `box-color` The standard color for containers
- `box-color-dark` Dark container color, often used for explanations or text-heavy containers
- `box-color-dark-soft` A lighter dark container color

Colors that are only used for one specific thing should not be placed in `app.css` – only commonly used ones. Trying to stick to colors from the `app.css` is however recommended for consistency.

### Buttons

Usually, buttons sit in layer 1. However, sometimes you want large, rounded buttons for controls that need to stand out. For that, combine the `standardButton` class with the `largeButton` class - the latter increases the border radius to the box-margin and also increases the other dimensions of the button. 

The `standardButton` is a red primary button by default. To make it secondary, add `white`. 

The button that commonly sits at the bottom of a popup can be replicated by adding `bottomButton`, `white` (unless a primary action) and `largeButton` to a `standardButton`. 

Buttons should always be placed in a visual container and not just on a blank page or direclty in a popup (unless it's a large button, which aligns well with the Popup's corner radius).

### Icons
Lucide is used for icons. At the default icon size (matches the font size), using `2` as the stroke width is suggested. Icons placed inside of buttons commonly look best at size `20`, slightly smaller, for which a stroke width of `2.25` looks best.

Certain Lucide icons are thinner than the rest, for example, the `X`. For those, `.25` is added to the stroke width to make them fit in.

## Text formatting guidelines

- Body text and headings should be written as plain sentences, without random capitalization (for example, “This is a nice location” rather than “This is a nice Location”).
- Official map names, competition names, tournament names, and the names of other user-creatable game elements should capitalize each word (for example, “Urban Competition”). However, when users create their own content, they are free to choose their own capitalization and formatting.
- Using a colon ":" for lists or labels is not recommended.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev
```

## Linting

`ESlint` is used for linting. Use it with `npm run lint`.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
