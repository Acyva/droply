import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Validate URL to prevent SSRF attacks
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const protocol = url.protocol.toLowerCase();
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(protocol)) {
      return false;
    }
    
    // Block private IP ranges
    const hostname = url.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
    ];
    
    if (privatePatterns.some(pattern => pattern.test(hostname))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// HTML decode common entities
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&#039;': "'",
    '&quot;': '"',
    '&apos;': "'",
  };
  
  return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    let requestBody: { url?: string };
    
    try {
      requestBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url } = requestBody;

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: "URL is required and must be a string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL
    if (!isValidUrl(url)) {
      return new Response(JSON.stringify({ error: "Invalid or blocked URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Droply/1.0; +https://droply.app)",
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch (fetchErr) {
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        return new Response(JSON.stringify({ error: "Request timeout" }), {
          status: 408,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.error("Fetch error:", fetchErr);
      return new Response(JSON.stringify({ error: "Failed to fetch URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      console.error(`HTTP error: ${response.status} for URL ${url}`);
      return new Response(JSON.stringify({ error: `HTTP ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let html: string;
    try {
      html = await response.text();
    } catch {
      return new Response(JSON.stringify({ error: "Failed to read response body" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate HTML
    if (!html || html.length === 0) {
      return new Response(JSON.stringify({ error: "Empty response body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit HTML size to prevent DoS
    const maxHtmlSize = 1024 * 1024; // 1MB
    if (html.length > maxHtmlSize) {
      html = html.substring(0, maxHtmlSize);
    }

    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");

    const getMetaContent = (html: string, patterns: string[]): string => {
      try {
        for (const pattern of patterns) {
          const regex = new RegExp(pattern, "i");
          const match = html.match(regex);
          if (match && match[1]) return match[1].trim();
        }
      } catch (err) {
        console.error("Error in getMetaContent:", err);
      }
      return "";
    };

    const title =
      getMetaContent(html, [
        '<meta[^>]+property="og:title"[^>]+content="([^"]*)"',
        '<meta[^>]+content="([^"]*)"[^>]+property="og:title"',
        '<meta[^>]+name="twitter:title"[^>]+content="([^"]*)"',
        '<title[^>]*>([^<]+)</title>',
      ]) || domain;

    const description = getMetaContent(html, [
      '<meta[^>]+property="og:description"[^>]+content="([^"]*)"',
      '<meta[^>]+content="([^"]*)"[^>]+property="og:description"',
      '<meta[^>]+name="description"[^>]+content="([^"]*)"',
      '<meta[^>]+content="([^"]*)"[^>]+name="description"',
    ]);

    const previewImage = getMetaContent(html, [
      '<meta[^>]+property="og:image"[^>]+content="([^"]*)"',
      '<meta[^>]+content="([^"]*)"[^>]+property="og:image"',
      '<meta[^>]+name="twitter:image"[^>]+content="([^"]*)"',
    ]);

    let absolutePreviewImage = previewImage;
    if (previewImage && !previewImage.startsWith("http")) {
      try {
        absolutePreviewImage = new URL(previewImage, url).href;
        // Validate resolved image URL
        if (!isValidUrl(absolutePreviewImage)) {
          absolutePreviewImage = "";
        }
      } catch {
        absolutePreviewImage = "";
      }
    } else if (previewImage && previewImage.startsWith("http")) {
      // Validate image URL
      if (!isValidUrl(previewImage)) {
        absolutePreviewImage = "";
      }
    }

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

    return new Response(
      JSON.stringify({
        title: decodeHtmlEntities(title.substring(0, 500)),
        description: decodeHtmlEntities(description.substring(0, 1000)),
        preview_image_url: absolutePreviewImage,
        favicon_url: faviconUrl,
        domain,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
