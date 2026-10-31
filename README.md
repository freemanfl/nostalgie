# Nostalgie — static restaurant website

Refactored using the structure and loading practices of [Oak Harbor Starter Kit V3](https://github.com/Oak-Harbor-Kits/Starter-KitV3). The restaurant design, menu, logo intro, section navigation, and gallery remain custom. This is not the kit's demo website with its branding swapped.

## Run locally

```sh
npm ci
npm run build
npm run check
npm start
```

Open **http://127.0.0.1:4176/**. Use this preview instead of a `file://` tab while developing. Stop the server with Ctrl+C.

The production files are ordinary HTML, CSS, JavaScript, images, and fonts. There is no application server or framework in production. LESS and CSS optimization run only during development/build, following V3's compiled stylesheet workflow.

## Edit the sources

The Czech homepage is `index.html`, with its full menu in `menu.html`. Edit `menu-data.json` for both menu presentations. The site has one language version.

- `index.html`: homepage structure and business copy. Content between `MENU:START` and `MENU:END` is generated; edit the JSON instead.
- `menu-data.json`: the single source for both menu presentations. `npm run build` updates the homepage panels and the standalone menu.
- `css/root.less`: shared design tokens, local fonts, base styles, controls, footer, mobile action bar.
- `css/critical.less`: header, hero, intro, and first-screen layout.
- `css/local.less`: remaining homepage sections, cards, category buttons, gallery, map, lightbox, and section dots.
- `css/menu.less`: standalone menu and print styling.
- `js/site.js`: section transitions, reveals, menu tabs, contained vertical menu scrolling, background motion, and gallery dialog.
- `js/restore.js`: reset scroll restoration before the page initializes.

Run `npm run build` after editing LESS or menu data. Do not edit generated `css/*.css` files. Stylesheets are loaded as normal external files: this deliberately avoids a flash of unstyled below-fold content when the custom section navigation moves quickly. JavaScript is deferred.

## Image and font loading

Images use local WebP variants, `srcset`, `sizes`, and explicit intrinsic dimensions. Only the hero receives high fetch priority; below-fold photos and the Google map are lazy-loaded. The original photos remain available for asset maintenance. The enhanced hero was reduced from 2,437,758 bytes as PNG to 223,162 bytes for its largest WebP variant.

Bree Serif and Barlow are hosted locally; only the main heading and body faces are preloaded. The N is an outlined SVG and does not wait for a font download. Text, images, the map, and menu remain accessible without the animated cover. `css/no-script.css` presents all menu categories if JavaScript is disabled.

The Google map remains a third-party embed. Its network timing depends on Google and the visitor's connection. There are no external font requests or image hotlinks.

## Validation and publishing

`npm run check` validates local references, anchors, unique IDs, image dimensions, JavaScript syntax, menu counts, and the deployable file list. The build writes a clean static bundle to `dist/`. Upload the contents of `dist/` to a static host; do not publish `node_modules/`, `archive/`, or `reference/`.

Domain-dependent canonical URLs, social image URLs, and sitemap settings should be completed when an actual production domain is selected. No fictitious canonical domain is included.

## Reference and history

- The original [Starter Kit V3](https://github.com/Oak-Harbor-Kits/Starter-KitV3) was studied for this refactor. Local reference copies and earlier prototypes are excluded from this repository.
- `brief.md` and `images/SOURCES.md`: research and asset provenance.

Adopted V3 practices: shared root styles, dedicated critical/page stylesheets, LESS sources, local fonts, sized responsive images, skip navigation, and static production delivery. Unrelated demo navigation, dark mode, and demo pages were not imported. Fixed font scaling was retained rather than scaling the entire page with body font size, so Czech menu text remains readable and card heights predictable.
