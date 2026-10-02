import type { MetadataRoute } from "next";
import { BRANDING } from "@/config/branding";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: `${BRANDING.URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${BRANDING.URL}/offline`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2
    }
  ];
}
