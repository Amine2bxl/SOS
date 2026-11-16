import type { MetadataRoute } from "next";
import { urlDuSite } from "@/lib/url-site";
import { ARTICLES } from "@/lib/presse";

/**
 * Le plan du site public, pour les moteurs de recherche. L'espace membre n'y
 * figure pas : il est privé, et `robots.ts` le tient à l'écart.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = urlDuSite();
  const pages: { chemin: string; priorite: number; frequence: "weekly" | "monthly" | "yearly" }[] = [
    { chemin: "", priorite: 1, frequence: "weekly" },
    { chemin: "/comprendre", priorite: 0.8, frequence: "monthly" },
    { chemin: "/communes", priorite: 0.7, frequence: "monthly" },
    { chemin: "/tarifs", priorite: 0.7, frequence: "monthly" },
    { chemin: "/association", priorite: 0.6, frequence: "monthly" },
    { chemin: "/presse", priorite: 0.6, frequence: "monthly" },
    ...ARTICLES.map((a) => ({ chemin: `/presse/${a.slug}`, priorite: 0.4, frequence: "yearly" as const })),
    { chemin: "/don", priorite: 0.5, frequence: "yearly" },
    { chemin: "/contact", priorite: 0.5, frequence: "yearly" },
    { chemin: "/mentions-legales", priorite: 0.2, frequence: "yearly" },
    { chemin: "/confidentialite", priorite: 0.2, frequence: "yearly" },
    { chemin: "/conditions-utilisation", priorite: 0.2, frequence: "yearly" },
  ];
  return pages.map((p) => ({
    url: `${site}${p.chemin}`,
    changeFrequency: p.frequence,
    priority: p.priorite,
  }));
}
