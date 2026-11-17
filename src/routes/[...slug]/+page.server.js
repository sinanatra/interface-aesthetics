import { error } from "@sveltejs/kit";
import { slugs, HOME } from "$lib/content";
import { getPage } from "$lib/server/render";

export const entries = () => [
  { slug: "" },
  ...slugs().map((slug) => ({ slug })),
];

export async function load({ params }) {
  const page = await getPage(params.slug || HOME);
  if (!page) error(404, "Not found");
  return { page, home: !params.slug };
}
