import type { MetadataRoute } from "next";
import { listPublishedSlugs, listPublicAuthors } from "@/lib/articles/public";
import { resolveSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/** Only published articles and public author handles are indexed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = resolveSiteOrigin();
  const [slugs, authors] = await Promise.all([
    listPublishedSlugs(),
    listPublicAuthors(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/articles",
    "/authors",
    "/topics",
    "/about",
  ].map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: path === "" || path === "/articles" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${origin}/articles/${slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const authorRoutes: MetadataRoute.Sitemap = authors.map((author) => ({
    url: `${origin}/authors/${author.id}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes, ...authorRoutes];
}
