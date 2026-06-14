# [Trick's Astro Blogy](http://tricx.de/)

A static astrophotography portfolio built with [Jekyll](https://jekyllrb.com/).  
Gallery index lives at `/galerie/`, individual detail pages at `/galerie/:slug/`.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Project structure](#project-structure)
3. [Setup](#setup)
4. [Local development](#local-development)
5. [Adding a new photo](#adding-a-new-photo)
6. [Front matter reference](#front-matter-reference)
7. [Layouts](#layouts)
8. [Assets](#assets)
9. [Configuration](#configuration)

---

## Tech stack

| Tool | Purpose |
|---|---|
| Jekyll 4 | Static site generator |
| Kramdown | Markdown renderer (supports GFM) |
| Rouge | Syntax highlighting |
| Pure CSS | No framework — single `assets/css/site.css` |
| GitHub Pages / any static host | Deployment target |

---

## Project structure

```
.
├── _config.yml               # Jekyll site configuration
├── Gemfile                   # Ruby gem dependencies
├── index.md                  # Home page (redirects to gallery layout)
│
├── _layouts/                 # HTML page templates
│   ├── default.html          # Base layout (head, body wrapper)
│   ├── gallery.html          # Gallery grid with category sections
│   └── photo.html            # Individual photo detail page
│
├── _photos/                  # One .md file per photo entry (collection)
│   ├── blood-moon.md
│   ├── iss-sun-transit.md
│   ├── m65-m66-ngc3628-leo-triplet.md
│   ├── m81-m82-ngc3077-bodes-galaxie.md
│   ├── m92-great-hercules-cluster.md
│   ├── m97-m108-owl-nebula.md
│   ├── m101-pinwheel-galaxy.md
│   ├── mineral-moon.md
│   └── ngc4631-whale-galaxy.md
│
├── assets/
│   ├── css/
│   │   └── site.css          # Single stylesheet for the entire site
│   ├── images/
│   │   ├── gallery/          # Preview images (one per photo entry)
│   │   │   └── overlay/      # Optional annotation overlays (SVG/PNG/JPG)
│   └── videos/
│       └── iss-sun-transit.mp4
│
├── contact/
│   └── index.md              # Contact page with obfuscated mailto form
│
├── galerie/
│   └── index.html            # Gallery index page (uses gallery layout)
│
├── vendor/                   # Bundler-managed gems (do not edit)
└── _site/                    # Jekyll build output (do not edit)
```

---

## Setup

Requires Ruby ≥ 2.6 and Bundler.

```bash
./bin/setup
```

If you switch between Intel and Apple Silicon on macOS, remove the old vendor bundle before reinstalling:

```bash
rm -rf vendor/bundle
./bin/setup
```

---

## Local development

```bash
bundle exec jekyll serve
```

Open [http://127.0.0.1:4000/](http://127.0.0.1:4000/).

Jekyll watches source files automatically and rebuilds on changes.  
The `_site/` directory is always the build output — never edit files there directly.

---

## Adding a new photo

1. **Copy** an existing file from `_photos/` and rename it to a descriptive slug, e.g. `_photos/ngc-224-andromeda.md`.
2. **Place the preview image** in `assets/images/gallery/`, matching the path you set in the `image` field.
3. *(Optional)* **Add an annotation overlay** (SVG, PNG, or JPG) named `<slug>` inside `assets/images/gallery/overlay/`. It is automatically detected and shown on hover.
4. *(Optional)* **Add a video** to `assets/videos/` and reference it with the `video` front matter key.
5. **Run** `bundle exec jekyll build` and check for YAML warnings.

---

## Front matter reference

All files in `_photos/` use the following YAML front matter:

```yaml
---
title: "NGC 224 – Andromeda Galaxy"   # Display title (required)
category: Galaxies                     # Groups entries in the gallery grid (required)
order: 6                               # Sort order within the category (required)
image: /assets/images/gallery/ngc-224-andromeda.jpg  # Preview image path (required)
summary: Short one-line teaser.        # Shown on hover card and detail page (required)

meta:                                  # Optional key/value pairs rendered in the detail panel
  - label: Object Type
    value: Spiral galaxy
  - label: Constellation
    value: Andromeda
  - label: Catalog
    value: M31, NGC 224
  - label: Image Acquisition           # Supports markdown (block scalar with "|")
    value: |
      - L 80×120s
      - 25× Darks / Bias / Flats
  - label: Equipment                   # Bullet list rendered as <ul>
    value: |
      - Sky-Watcher Explorer 150P
      - Canon EOS 7D Mark II
      - Sky-Watcher EQ6R Pro

video: /assets/videos/andromeda-timelapse.mp4  # Optional: adds a video section below the image
---

Optional longer description shown in a full-width framed section below the image and metadata panel.
Supports full Markdown.
```

### Front matter field details

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | Shown as page `<h1>` and browser tab title |
| `category` | string | ✅ | Groups photos in the gallery; used for jump-links |
| `order` | integer | ✅ | Sort order within the category group |
| `image` | path | ✅ | Relative path from site root to the preview JPEG/PNG |
| `summary` | string | ✅ | One-line description for gallery card overlay and detail lead text |
| `meta` | list | — | Each item has `label` (string) and `value` (string or multiline block) |
| `video` | path | — | MP4 path; adds a `<video>` section below the detail grid |

---

## Layouts

### `default.html`
Base layout used by all pages. Renders `<head>` (meta, CSS link) and a `.page-shell` wrapper.  
Activated via `layout: default` in front matter.

### `gallery.html`
Renders the main gallery index. Groups `site.photos` by `category`, sorted by `order`.  
Each group becomes a `<section>` with a card grid.  
Activated via `layout: gallery` in front matter.

### `photo.html`
Renders an individual photo detail page. Inherits `default.html`.  
Features:
- Two-column grid: full-height image left, metadata panel right
- Keyboard/click zoom on the main image
- Optional annotation overlay (auto-detected from `assets/images/gallery/overlay/`)
- Circular prev/next navigation between all photos (sorted by title)
- Full-width framed description section below the grid (from the page body / Markdown content)
- Optional video section

Activated automatically for all `_photos/*.md` via `_config.yml` defaults.

---

## Assets

### CSS — `assets/css/site.css`
Single stylesheet. Sections (in order):
1. **Custom properties** — colors, spacing, max-width
2. **Base** — reset, body background, typography
3. **Header & navigation**
4. **Hero / section-intro**
5. **Gallery grid & cards**
6. **Photo detail** — grid, figure, zoom, overlay, nav buttons
7. **Metadata panel** (`.detail-copy`, `.meta-list`)
8. **Full-width description** (`.detail-description`)
9. **Video section**
10. **Contact form**
11. **Responsive breakpoints** (`@media max-width: 800px`)

### Images — `assets/images/gallery/`
One image file per photo entry. Naming must match the `image` front matter path.  
Place annotation overlays in the `overlay/` sub-folder using the same slug as the photo file.

### Videos — `assets/videos/`
MP4 files referenced by the `video` front matter key.

---

## Configuration

`_config.yml` key settings:

```yaml
title: Star Gallery          # Site name (used in <title> tag)
lang: en                     # HTML lang attribute
contact_email: ...           # Used by the contact page (obfuscated in JS)
permalink: pretty            # URLs rendered as /galerie/slug/ (no .html)

collections:
  photos:
    output: true             # Each _photos/*.md generates a page
    permalink: /galerie/:slug/

exclude:
  - README.md
  - Gemfile.lock
```
