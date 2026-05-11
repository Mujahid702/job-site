export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin",
      },
    ],
    sitemap: "https://BuggedBrain.vercel.app/sitemap.xml",
  };
}