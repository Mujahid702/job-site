export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://job-site-buggedbrain.vercel.app/sitemap.xml",
  };
}