import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import chokidar from "chokidar";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");

const CONTENT_DIR = path.join(__dirname, "content");
const TEMPLATE_DIR = path.join(__dirname, "templates");
const STYLE_DIR = path.join(__dirname, "styles");

const BLOG_DIR = path.join(ROOT, "blog");
const BLOG_ASSETS_DIR = path.join(BLOG_DIR, "assets");

const SITE_URL = "https://notepad.js.org";

const IMAGE_DIR = path.join(__dirname, "images");
const BLOG_IMAGE_DIR = path.join(BLOG_DIR, "images");

const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
});

function copyImages() {
    if (!fs.existsSync(IMAGE_DIR)) {
        return;
    }

    fs.mkdirSync(BLOG_IMAGE_DIR, { recursive: true });

    const files = fs.readdirSync(IMAGE_DIR);

    for (const file of files) {
        const source = path.join(IMAGE_DIR, file);
        const destination = path.join(BLOG_IMAGE_DIR, file);

        if (fs.statSync(source).isFile()) {
            fs.copyFileSync(source, destination);
        }
    }

    console.log("✓ blog/images/");
}

function readFile(filePath) {
    return fs.readFileSync(filePath, "utf8");
}

function writeFile(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(date) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(new Date(`${date}T00:00:00`));
}

function calculateReadingTime(text) {
    const words = text
        .replace(/<[^>]*>/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return Math.max(1, Math.ceil(words.length / 200));
}

function buildJsonLd(post) {
    const data = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.description,
        "datePublished": post.date,
        "dateModified": post.updated || post.date,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${SITE_URL}/blog/${post.slug}/`
        },
        "publisher": {
            "@type": "Organization",
            "name": "Notepad.js.org",
            "url": SITE_URL
        }
    };

    if (post.ogImage) {
        data.image = `${SITE_URL}${post.ogImage}`;
    }

    return JSON.stringify(data)
        .replaceAll("<", "\\u003c")
        .replaceAll(">", "\\u003e")
        .replaceAll("&", "\\u0026");
}

function getPosts() {
    const files = fs
        .readdirSync(CONTENT_DIR)
        .filter((file) => file.endsWith(".md"));

    return files
        .map((file) => {
            const filePath = path.join(CONTENT_DIR, file);
            const source = readFile(filePath);
            const parsed = matter(source);

            const content = parsed.content.trim();

            if (!parsed.data.title) {
                throw new Error(`Missing title in ${file}`);
            }

            if (!parsed.data.description) {
                throw new Error(`Missing description in ${file}`);
            }

            if (!parsed.data.date) {
                throw new Error(`Missing date in ${file}`);
            }

            if (!parsed.data.slug) {
                throw new Error(`Missing slug in ${file}`);
            }

            return {
                ...parsed.data,
                content,
                html: markdown.render(content),
                readingTime: calculateReadingTime(content)
            };
        })
        .sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
}

function renderTemplate(template, variables) {
    return template.replace(
        /{{\s*([\w]+)\s*}}/g,
        (_, key) => variables[key] ?? ""
    );
}

function buildPost(post, template) {
    const url = `${SITE_URL}/blog/${post.slug}/`;

    const html = renderTemplate(template, {
        title: escapeHtml(post.title),
        description: escapeHtml(post.description),
        category: escapeHtml(post.category || "Notes"),
        date: formatDate(post.date),
        readingTime: post.readingTime,
        url,
        ogImage: post.ogImage
            ? escapeHtml(`${SITE_URL}${post.ogImage}`)
            : "",
        jsonLd: buildJsonLd(post),
        content: post.html,

        ctaTitle: escapeHtml(
            post.ctaTitle || "Need a simple place to write?"
        ),

        ctaDescription: escapeHtml(
            post.ctaDescription ||
            "Notepad.js.org is a free, private and distraction-free notepad that works right in your browser."
        )
    });

    const outputPath = path.join(
        BLOG_DIR,
        post.slug,
        "index.html"
    );

    writeFile(outputPath, html);

    console.log(`✓ ${post.slug}/`);
}

function buildIndex(posts, template) {
    const postsHtml = posts
        .map((post) => {
            return `
        <article class="post">
          <p class="post-date">${escapeHtml(formatDate(post.date))}</p>

          <h2>
            <a href="/blog/${escapeHtml(post.slug)}/">
              ${escapeHtml(post.title)}
            </a>
          </h2>

          <p class="post-description">
            ${escapeHtml(post.description)}
          </p>

          <p class="post-category">
            <svg width="15px" height="15px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#707070"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Interface / Tag"> <g id="Vector"> <path d="M4.74791 7.64502L4.41669 11.2885C4.36763 11.8281 4.34289 12.1001 4.3878 12.3584C4.42792 12.5892 4.50806 12.8112 4.62496 13.0142C4.7563 13.2422 4.95043 13.4363 5.33647 13.8224L10.512 18.9979C11.299 19.7849 11.6927 20.1786 12.148 20.3265C12.5496 20.4571 12.983 20.4573 13.3847 20.3268C13.8414 20.1785 14.2382 19.7821 15.0302 18.9901L18.99 15.0303C19.7821 14.2382 20.1774 13.8424 20.3258 13.3857C20.4563 12.9841 20.4555 12.5511 20.325 12.1495C20.1766 11.6928 19.7819 11.297 18.9898 10.505L13.8271 5.34229C13.4375 4.95272 13.2427 4.75792 13.0136 4.62598C12.8107 4.50908 12.5886 4.4286 12.3579 4.38848C12.0974 4.3432 11.823 4.36809 11.2743 4.41797L7.64449 4.74796C6.69973 4.83384 6.22705 4.87698 5.85738 5.08255C5.53145 5.26379 5.26277 5.53248 5.08152 5.8584C4.87698 6.22623 4.83432 6.69555 4.74929 7.63092L4.74791 7.64502Z" stroke="#707070" stroke-width="2.208" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M9.71259 9.71297C10.1031 9.32244 10.1031 8.68928 9.71259 8.29876C9.32206 7.90823 8.68845 7.90823 8.29792 8.29876C7.9074 8.68928 7.90702 9.32229 8.29755 9.71282C8.68807 10.1033 9.32206 10.1035 9.71259 9.71297Z" stroke="#707070" stroke-width="2.208" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g> </g></svg>
            ${escapeHtml(post.category || "Notes")}
          </p>
        </article>
      `;
        })
        .join("\n");

    const html = renderTemplate(template, {
        posts: postsHtml
    });

    writeFile(
        path.join(BLOG_DIR, "index.html"),
        html
    );

    console.log("✓ blog/index.html");
}

function copyAssets() {
    fs.mkdirSync(BLOG_ASSETS_DIR, { recursive: true });

    fs.copyFileSync(
        path.join(STYLE_DIR, "blog.css"),
        path.join(BLOG_ASSETS_DIR, "blog.css")
    );

    console.log("✓ blog/assets/blog.css");
}

function cleanGeneratedBlog() {
    if (!fs.existsSync(BLOG_DIR)) {
        return;
    }

    const entries = fs.readdirSync(BLOG_DIR);

    for (const entry of entries) {
        fs.rmSync(
            path.join(BLOG_DIR, entry),
            { recursive: true, force: true }
        );
    }
}

function build() {
    console.log("Building blog...\n");

    cleanGeneratedBlog();

    const posts = getPosts();

    const postTemplate = readFile(
        path.join(TEMPLATE_DIR, "post.html")
    );

    const indexTemplate = readFile(
        path.join(TEMPLATE_DIR, "index.html")
    );

    for (const post of posts) {
        buildPost(post, postTemplate);
    }

    buildIndex(posts, indexTemplate);
    copyAssets();
    copyImages();

    console.log(`\nBuilt ${posts.length} article(s).`);
}

if (process.argv.includes("--watch")) {
    build();

    const watcher = chokidar.watch(
        [
            CONTENT_DIR,
            TEMPLATE_DIR,
            STYLE_DIR
        ],
        {
            ignoreInitial: true
        }
    );

    let timeout;

    watcher.on("all", () => {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            console.log("\nChange detected. Rebuilding...\n");
            build();
        }, 100);
    });

    console.log("\nWatching for changes...\n");
} else {
    build();
}