import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

// GitHub-style heading slugs, so the essay's own in-document links keep working.
const slugify = (s) =>
  s.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s/g, "-");

export default function (eleventyConfig) {
  const md = markdownIt({ html: true })
    .use(markdownItAnchor, { slugify, level: [1, 2, 3, 4], tabIndex: false });

  // Tables scroll inside their own wrapper so wide tables never break the page.
  md.renderer.rules.table_open = () => '<div class="table-wrap">\n<table>\n';
  md.renderer.rules.table_close = () => "</table>\n</div>\n";

  eleventyConfig.setLibrary("md", md);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });

  eleventyConfig.addFilter("isoDate", (d) =>
    d instanceof Date ? d.toISOString().slice(0, 10) : String(d)
  );

  // Build a table of contents from the rendered h2 headings.
  eleventyConfig.addFilter("toc", (content) => {
    const headings = [];
    const re = /<h2 id="([^"]*)"[^>]*>([\s\S]*?)<\/h2>/g;
    let m;
    while ((m = re.exec(content))) {
      const text = m[2].replace(/<[^>]*>/g, "").trim();
      if (text.toLowerCase() === "contents") continue;
      headings.push({ id: m[1], text });
    }
    return headings;
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
