import type { MetadataRoute } from "next";
import { BRANDING } from "@/config/branding";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/"
    },
    sitemap: `${BRANDING.URL}/sitemap.xml`
  };
}
