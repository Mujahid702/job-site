import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "A valid HTTP or HTTPS hiring URL is required." },
        { status: 400 }
      );
    }

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

    // 6. Limit character count to prevent overflowing model token windows on huge pages
    if (cleanedText.length > 80000) {
      cleanedText = cleanedText.substring(0, 80000) + "\n\n...[Truncated]";
    }

    if (!cleanedText) {
      throw new Error("The scraper retrieved empty text content from the URL.");
    }

    return NextResponse.json({
      title: pageTitle,
      text: cleanedText
    });
  } catch (err: any) {
    console.error("Scraper API Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to scrape job details from the provided URL." },
      { status: 500 }
    );
  }
}
