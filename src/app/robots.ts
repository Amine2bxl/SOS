import type { MetadataRoute } from "next";

/** Le site public s'indexe ; l'espace membre, la connexion et les API, non. */
export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/tableau-de-bord", "/adherer", "/api/", "/auth/"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
