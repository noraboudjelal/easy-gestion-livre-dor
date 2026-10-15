# Shared showroom layout

`app/showroom-layout.css` owns geometry for `/demo-renovation` (Maison & Sols)
and all `/catalogue/[slug]` pages rendered by `ShowroomView`.

Keep the `showroom-layout` class on the root and use `hero`, `body` (or
`content` for the demo), `grid`, `desc`, `foot` and `showroom-actions` for
new sections. Colors, fonts, images and interactions stay in their existing
components. Do not add per-section horizontal padding overrides.

Variables: `--showroom-width`, `--showroom-gutter`,
`--showroom-section-space`, `--showroom-gap`. The demo retains its 900px
canvas and dynamic showrooms retain 980px; every section within each uses
the same canvas and gutters. Grids keep two columns and stack below 380px.

Verification still required: run the Next application, inspect both routes
at 360px, 768px and 1440px, including offers, empty collections,
realisations, before/after cards, contact links and the product modal.
Dependency installation in the editing environment failed with Node
EPERM on fs.promises.realpath, so no build or browser QA is claimed.
