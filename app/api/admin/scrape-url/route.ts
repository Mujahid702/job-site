import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const scrapeUrlSchema = z.object({
  url: z.string().trim().url("Invalid URL format").min(1, "URL is required")
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate server-side admin role
    const authResult = await verifyAdmin();
    if (!authResult.authorized) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    // 2. Rate limiting check
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const limitResult = await rateLimit(ip, "scrape");
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, message: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: limitResult.headers }
      );
    }

    // 3. Zod input validation
    const body = await request.json().catch(() => ({}));
    const validation = scrapeUrlSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input fields.", errors: validation.error.flatten() },
        { status: 400, headers: limitResult.headers }
      );
    }

    const { url } = validation.data;

    console.log(`Starting scrape for URL: ${url}`);

    // Fetch the URL with custom browser-like headers to prevent getting blocked by anti-scraping firewalls
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      next: { revalidate: 0 } // Bypass Next.js cache
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page. HTTP Status ${response.status}`);
    }

    const html = await response.text();
    
    // Clean up the HTML to keep only core textual elements
    let cleanedText = html;
    
    // 1. Strip script, style, noscript, and iframe tags along with their content
    cleanedText = cleanedText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    cleanedText = cleanedText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    cleanedText = cleanedText.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");
    cleanedText = cleanedText.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
    cleanedText = cleanedText.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "");
    
    // 2. Strip head, nav, footer, header tags if present
    cleanedText = cleanedText.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "");
    cleanedText = cleanedText.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "");
    cleanedText = cleanedText.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "");

    // 3. Extract title if present
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : "Job Posting";

    // 4. Strip all remaining HTML tags, converting common blocks (p, div, br, li, tr) to line breaks
    cleanedText = cleanedText.replace(/<\/p>|<\/div>|<br\s*\/?>|<\/li>|<\/tr>|<\/h[1-6]>/gi, "\n");
    cleanedText = cleanedText.replace(/<[^>]+>/g, " ");

    // 5. Clean up whitespaces and redundant empty lines
    cleanedText = cleanedText
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n\n")
      .trim();

    // Try to extract meta description and page title to enrich or use as fallback
    const ogDescriptionMatch = html.match(/<meta\s+[^>]*property=["']og:description["']\s+content=["']([^"']*)["']/i) ||
                               html.match(/<meta\s+[^>]*name=["']description["']\s+content=["']([^"']*)["']/i) ||
                               html.match(/<meta\s+[^>]*content=["']([^"']*)["']\s+[^>]*(?:property|name)=["']og:description["']/i) ||
                               html.match(/<meta\s+[^>]*content=["']([^"']*)["']\s+[^>]*(?:property|name)=["']description["']/i);
    const metaDesc = ogDescriptionMatch ? ogDescriptionMatch[1].trim() : "";

    const ogTitleMatch = html.match(/<meta\s+[^>]*property=["']og:title["']\s+content=["']([^"']*)["']/i) ||
                         html.match(/<meta\s+[^>]*name=["']title["']\s+content=["']([^"']*)["']/i) ||
                         html.match(/<meta\s+[^>]*content=["']([^"']*)["']\s+[^>]*(?:property|name)=["']og:title["']/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : "";

    const pageTitleToUse = pageTitle && pageTitle !== "Job Posting" ? pageTitle : (ogTitle || "Job Posting");

    let finalCleaned = cleanedText;

    if (!finalCleaned || finalCleaned.length < 50) {
      // Fallback 1: Try a less aggressive cleanup (retain header/footer/nav/etc)
      let fallbackText = html;
      fallbackText = fallbackText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
      fallbackText = fallbackText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
      fallbackText = fallbackText.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");
      fallbackText = fallbackText.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
      fallbackText = fallbackText.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "");
      
      fallbackText = fallbackText.replace(/<\/p>|<\/div>|<br\s*\/?>|<\/li>|<\/tr>|<\/h[1-6]>/gi, "\n");
      fallbackText = fallbackText.replace(/<[^>]+>/g, " ");
      fallbackText = fallbackText
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n+/g, "\n\n")
        .trim();

      if (fallbackText && fallbackText.length >= 50) {
        finalCleaned = fallbackText;
      }
    }

    // Prepend metadata description if we got one and it's not already in the text
    if (metaDesc && finalCleaned && !finalCleaned.includes(metaDesc)) {
      finalCleaned = `Description: ${metaDesc}\n\n${finalCleaned}`;
    } else if (metaDesc && !finalCleaned) {
      finalCleaned = `Description: ${metaDesc}`;
    }

    // If still completely empty or too short to be a job posting
    if (!finalCleaned || finalCleaned.trim().length < 20) {
      finalCleaned = `[Automatic text extraction failed because this page requires JavaScript execution. Please copy and paste the job description text manually here.]`;
    }

    // 6. Limit character count to prevent overflowing model token windows on huge pages
    if (finalCleaned.length > 80000) {
      finalCleaned = finalCleaned.substring(0, 80000) + "\n\n...[Truncated]";
    }

    return NextResponse.json({
      title: pageTitleToUse,
      text: finalCleaned
    });
  } catch (err: any) {
    console.error("Scraper API Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to scrape job details from the provided URL." },
      { status: 500 }
    );
  }
}
