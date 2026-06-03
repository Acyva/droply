import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Droply/1.0; +https://droply.app)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");

    const getMetaContent = (html: string, patterns: string[]): string => {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, "i");
        const match = html.match(regex);
        if (match && match[1]) return match[1].trim();
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
      } catch {
        absolutePreviewImage = "";
      }
    }

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    return new Response(
      JSON.stringify({
        title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#039;/g, "'").replace(/&quot;/g, '"'),
        description: description.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#039;/g, "'").replace(/&quot;/g, '"'),
        preview_image_url: absolutePreviewImage,
        favicon_url: faviconUrl,
        domain,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
