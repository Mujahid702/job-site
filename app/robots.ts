export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://BuggedBrain.vercel.app/sitemap.xml",
  };
}