![OpenGuessr logo](static/img/openguessr.svg)

# OpenGuessr

The free location guessing game.

## Framework

OpenGuessr uses [Svelte](https://svelte.dev). 

## Styling guidelines

The `app.css` file contains a bunch of classes. Only if there is **no applicable predefined class**, create a new 
one inside of a component or page. Class names must be kebab-case. OpenGuessr uses a `CSS component library` approach for simple components, and only uses Svelte components for complex UI parts that require JS (in `/components/ui`).

As part of OpenGuessr's design system, margin, padding and border radius should only use variables defined in `app.css`.
> [!TIP]
> Exceptions can be made if an icon or text doesn't look properly aligned.

| Variable | Value | Purpose |
| -------- | ----- | ------- |
| --content-margin | 5px | Controls (buttons, labels, inputs) |
| --panel-margin | 8px | Floating panels fixed to viewport |
| --box-margin | 10px | Boxes (containers) |
| --layout-margin | 15px | Layout gaps, box border-radius |
| --layout-margin + --box-margin | 25px | Popups, sheets |
| --layout-spacer | 50px | To separate sections in pages |

**Boxes** always use `--box-margin` for padding and gap. Their border-radius is `--layout-margin` when placed in a page, or `--box-margin` when nested inside a popup or another box.

**Layouts** use `--layout-margin` as the gap between boxes (and padding, when applicable). To separate larger sections in pages with a margin (or gap), use `--layout-spacer`.

**Panels** use `--panel-margin` for padding and gap. The gap or margin between panels is usually `--box-margin`.

**Popups** and large elements use 25px (`--layout-margin` + `--box-margin`) for border-radius.

### Boxes

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

Boxes that contain text often look more well-rounded with `padding-inline: var(--layout-margin)` since the font naturally adds a bit of padding towards the top and bottom. This ensures better readability.

### Colors

Please refer to the color section in `app.css`, but the most important ones are:
- `--brand-color` The distinctive red
- `--panel-color` A more opaque dark blue used for UI floating above the panorama
- `--panel-color-soft` A slightly lighter version of the panel color, used when UI is overlayed above a dark background and the panorama
- `--box-color` The standard color for containers
- `--box-color-dark` Dark container color, often used for explanations or text-heavy containers
- `--box-color-dark-soft` A lighter dark container color

Colors that are only used for one specific thing should not be placed in `app.css` – only commonly used ones. Trying to stick to colors from the `app.css` is however recommended for consistency.

### Box shadows

Every visual container that sits in no parent visual container (e.g. not inside a Popup, not inside an element with the `bar-menu` class...) needs the `--panel-shadow` box shadow (which the `bar-menu` class includes). Elements inside a visual container should typically use `--box-shadow` (if they are a box), sometimes `--bulb-shadow` (for example, a highlighted badge) or `--button-shadow` depending on what the are.

### Buttons

Usually, buttons sit in layer 1. However, sometimes you want large, rounded buttons for controls that need to stand out. For that, combine the `standard-button` class with the `large-button` class - the latter increases the border radius to the box-margin and also increases the other dimensions of the button. 

The `standard-button` is a red primary button by default. To make it secondary, add `white`. To make it even more subtle, add `dark` instead (use thoughtfully).

The button that commonly sits at the bottom of a popup can be replicated by adding `bottom-button`, `white` (unless a primary action) and `large-button` to a `standard-button`. 

Buttons should always be placed in a visual container and not just on a blank page or direclty in a popup (unless it's a large button, which aligns well with the Popup's corner radius).

### Icons

Lucide is used for icons. At the default icon size (matches the font size), using `2` as the stroke width is suggested. Icons placed inside of buttons commonly look best at size `20`, slightly smaller, for which a stroke width of `2.25` looks best.

Certain Lucide icons are thinner than the rest, for example, the `X`. For those, `.25` is added to the stroke width to make them fit in.

### Overfade

Overfade is a library installed that allows for beautiful scroll containers. It applies a mask-image on the container that overflows depending on the scroll position of the content. For example, when a container that contains overflowing text content is scrolled all the way to the top, the top of the text is not faded out, only the bottom. 

To use it, simply add it's classes:
- `of-top`: Fade out towards the top (dynamically)
- `of-bottom`: Fade out towards the bottom (dynamically)
- `of-left`: Fade out towards the left (dynamically)
- `of-right`: Fade out towards the right (dynamically)
- `of-length-x`: Multiply the length of the fade, defaults to 1 (optional, x = factor)

### Opacity values

Opacity values used are typically `0.25`, `0.5`, `0.75` and `1`. Using others such as `0.7` is discouraged. 

### Blur values

Unless an extreme outlier is needed, stick to the provided CSS variables `--weak-blur`, `--normal-blur`, `--elevated-blur` and `--strong-blur`.

### Images

Apply `pointer-events: none` as well as `user-select: none` to ensure that they aren't dragable and integrate nicely into the interface. It's not universally applied since some images need to be interactive (e.g. pin image on the map).

## Text formatting guidelines

- Body text and headings should be written as plain sentences, also known as sentence case, as opposed to title case (for example, “Game overview” rather than “Game Overview”). The only exception that OpenGuessr makes is for content that needs a clear title or branding such as modes (e.g. Country Guessr), maps (e.g. Capital Cities), competitions, and tournaments.
- Official map names, competition names, tournament names, and the names of other user-creatable game elements should capitalize each word (for example, “Urban Competition”). However, when users create their own content, they are free to choose their own capitalization and formatting.
- Using a colon ":" in or for UI labels is not recommended.

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
