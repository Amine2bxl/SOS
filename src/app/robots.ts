import type { MetadataRoute } from "next";
import { urlDuSite } from "@/lib/url-site";

/** Le site public s'indexe ; l'espace membre, la connexion et les API, non. */
export default function robots(): MetadataRoute.Robots {
  const site = urlDuSite();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/tableau-de-bord", "/adherer", "/api/", "/auth/"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
