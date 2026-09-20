import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bloodlink.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/nearby",
          "/privacy",
          "/terms",
          "/privacy-policy",
          "/terms-and-conditions",
          "/login",
          "/register",
        ],
        disallow: [
          "/dashboard/",
          "/reset-password/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
