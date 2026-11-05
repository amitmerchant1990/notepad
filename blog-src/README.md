# Blog source

This directory contains the source files for the blog at [notepad.js.org/blog/](https://notepad.js.org/blog/).

The blog is a small static site. Articles are written in Markdown and the build script turns them into HTML pages in the root-level `blog/` directory. The generated files in `blog/` are the files served by the site.

## Directory structure

```text
blog-src/
├── content/       # Markdown source files for articles
├── images/        # Article images used by the generated pages
├── styles/        # Shared blog CSS
├── templates/     # HTML templates for the index and article pages
├── build.js       # Static-site build script
├── package.json   # Build and watch commands
└── package-lock.json

blog/              # Generated output; do not edit by hand
```

The build removes and recreates the contents of `blog/` on every run. This means changes made directly in `blog/` will be lost the next time the site is built.

## Setup

Use a current Node.js installation, then install the dependencies from this directory:

```sh
cd blog-src
npm ci
```

`npm ci` uses `package-lock.json` so everyone gets the same dependency versions. Use `npm install` only when intentionally changing dependencies or regenerating the lockfile.

## Create a new post

1. Create a Markdown file in `blog-src/content/`. The filename is only for organization; the public URL comes from the `slug` field.
2. Add the required front matter at the top of the file.
3. Write the article below the closing `---` line.
4. Add a matching image to `blog-src/images/` if the article uses an Open Graph image.
5. Build the site and inspect the generated page locally.

Example:

```markdown
---
title: "A Useful Article Title"
description: "A short description used in the page metadata and article listing."
date: "2026-11-05"
slug: "useful-article-title"
category: "Writing"
ogImage: "/blog/images/useful-article-title.png"
---

Write the article here using Markdown.

## A section heading

You can use [links](/), lists, quotes, code blocks, and other Markdown supported by Markdown-It.
```

### Front matter

These fields are required:

| Field | Purpose |
| --- | --- |
| `title` | Article title, used in the page title, heading, metadata, and index. |
| `description` | Short summary used in metadata and the article listing. |
| `date` | Publication date in `YYYY-MM-DD` format. Articles are sorted newest first. |
| `slug` | URL-safe path for the article, such as `useful-article-title`. The page is generated at `/blog/<slug>/`. |

These fields are optional:

| Field | Purpose |
| --- | --- |
| `category` | Label shown above the article title. Defaults to `Notes`. |
| `ogImage` | Absolute site path to a social/share image, usually `/blog/images/<filename>`. |
| `updated` | Last-modified date used in the structured data. Defaults to `date`. |
| `ctaTitle` | Custom call-to-action heading at the end of the article. |
| `ctaDescription` | Custom call-to-action text. |

Keep each `slug` unique. A duplicate slug causes posts to overwrite one another in the generated output.

## Images and links

Put article images in `blog-src/images/`. The build copies them to `blog/images/`, so reference them in front matter or Markdown with a site-root path:

```yaml
ogImage: "/blog/images/useful-article-title.png"
```

```markdown
![Descriptive alt text](/blog/images/useful-article-title.png)
```

Use site-relative links for pages on Notepad.js.org, for example `/`, `/blog/`, or `/rich-text-notes/`. Use full `https://` URLs for external sites.

The Markdown renderer allows inline HTML, automatically turns plain URLs into links, and uses typographic replacements. Remember to provide useful alt text for images and keep headings in a logical order.

## Build commands

Run these commands from `blog-src`:

```sh
# Build all articles once
npm run build

# Rebuild automatically when content, templates, or styles change
npm run watch
```

The build generates:

- `blog/index.html` — the article listing
- `blog/<slug>/index.html` — one page per article
- `blog/assets/blog.css` — the copied stylesheet
- `blog/images/*` — the copied article images

## Preview locally

After building, start a static web server from the project root so the `/blog/` paths work correctly:

```sh
cd ..
python3 -m http.server 8000
```

Open [http://localhost:8000/blog/](http://localhost:8000/blog/) in a browser. For a quicker writing loop, keep `npm run watch` running in `blog-src` and refresh the browser after a rebuild.

Before publishing, check:

- the article appears in the correct order on `/blog/`;
- the article URL matches its `slug`;
- the title, description, date, category, and reading time look right;
- links and images load;
- the page looks good on a narrow screen;
- social metadata is correct when `ogImage` is set.

## Deploy

Deployment is static-file deployment through the repository's GitHub Pages setup. The custom domain is defined by the root `CNAME` file, and `.nojekyll` is present so GitHub Pages serves the files as-is.

From the project root:

```sh
# Rebuild the generated blog output
cd blog-src
npm ci                 # only needed for a fresh checkout
npm run build

# Review the generated files, then return to the project root
cd ..
git status
git diff -- blog-src blog
```

If everything looks correct, commit both the source and generated output, then push the branch used for the site:

```sh
git add blog-src blog
git commit -m "Add blog post: useful article title"
git push origin <branch>
```

Replace `<branch>` with the branch configured in the repository's GitHub Pages settings. The generated `blog/` files must be included in the commit because they are the deployable site output.

After the push, wait for GitHub Pages to publish the change and then verify both `/blog/` and the new `/blog/<slug>/` URL on the live site. If a post is removed, run the build before committing so its generated page is removed from `blog/` as well.

## Updating the blog system

- Edit `templates/index.html` to change the article listing page.
- Edit `templates/post.html` to change the structure or metadata of every article.
- Edit `styles/blog.css` to change blog styling.
- Edit `build.js` only when changing build behavior or supported front matter.

After changing any of these files, run `npm run build`, review the generated output, and commit the source change together with the resulting changes under `blog/`.

## Common problems

- **`npm run build` cannot find a dependency:** run `npm ci` inside `blog-src`.
- **A post fails to build:** check that `title`, `description`, `date`, and `slug` are present in its front matter.
- **An image is missing:** confirm the file is in `blog-src/images/` and that the URL starts with `/blog/images/`.
- **The page works at `/blog/` but not when opened as a file:** use a local web server; the site relies on root-relative URLs.
- **A change disappeared:** do not edit `blog/` directly. Change the corresponding source file and rebuild.

