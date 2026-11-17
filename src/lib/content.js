export const SITE = "Interface Aesthetics";
export const HOME = "about";

const files = import.meta.glob("/content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const pages = Object.fromEntries(
  Object.entries(files).map(([path, md]) => [
    path.slice("/content/".length, -".md".length),
    md,
  ]),
);

export const titleOf = (md) => md.match(/^#\s+(.+)$/m)?.[1].trim() ?? "";

export const slugs = () => Object.keys(pages);

function folder(name) {
  const prefix = name + "/";
  return slugs()
    .filter(
      (slug) =>
        slug.startsWith(prefix) && !slug.slice(prefix.length).includes("/"),
    )
    .sort()
    .map((slug) => ({
      slug,
      number: slug.slice(prefix.length).match(/^(\d+)-/)?.[1] ?? "",
      title: titleOf(pages[slug]),
    }));
}

export const lessons = () => folder("lessons");
export const editions = () => folder("editions").reverse();
