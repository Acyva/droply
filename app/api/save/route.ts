import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Single user mode - items are saved for this user
// This matches the actual user in the database
const USER_ID = 'd841ec80-1c05-4844-ae9f-489db53bf675';

const VALID_TYPES = ['link', 'text', 'file'];

export async function POST(request: Request) {
  // Bearer token authentication
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const expectedToken = process.env.API_SECRET_KEY || process.env.SECRET_API_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, content, title, notes } = body;

  // Validate required fields
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let finalTitle = title || '';
  let description = '';
  let domain = '';
  let faviconUrl = '';
  let previewImageUrl = '';

  // For links, fetch metadata if title not provided
  if (type === 'link') {
    try {
      const url = new URL(content);
      domain = url.hostname.replace('www.', '');
      faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      // Invalid URL, continue without metadata
    }

    // Fetch title from URL if not provided
    if (!finalTitle) {
      try {
        const response = await fetch(content, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DroplyBot/1.0)',
          },
        });
        const html = await response.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          finalTitle = titleMatch[1].trim();
        }

        // Try to extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        if (descMatch && descMatch[1]) {
          description = descMatch[1].trim();
        }

        // Try to extract OG image
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        if (ogImageMatch && ogImageMatch[1]) {
          previewImageUrl = ogImageMatch[1];
        }
      } catch (e) {
        console.error('Failed to fetch metadata:', e);
      }
    }
  }

  // Map type to item type
  const itemType = type === 'text' ? 'note' : type === 'file' ? 'link' : 'link';

  // Insert the item
  const { data, error } = await supabase
    .from('items')
    .insert({
      user_id: USER_ID,
      type: itemType,
      url: type === 'link' ? content : '',
      title: finalTitle || (type === 'text' ? content.substring(0, 100) : content),
      description,
      personal_notes: notes || '',
      domain,
      favicon_url: faviconUrl,
      preview_image_url: previewImageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({
    message: 'Save API endpoint. Use POST with Bearer token.',
    requiredFields: ['type (link|text|file)', 'content'],
    optionalFields: ['title', 'notes'],
  });
}
