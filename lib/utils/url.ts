export const getSiteUrl = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this in your env for production
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
    'http://localhost:3000';
  
  // Make sure to include `https://` when not localhost
  url = url.includes('http') ? url : `https://${url}`;
  // Remove trailing slash
  url = url.endsWith('/') ? url.slice(0, -1) : url;
  
  return url;
};
