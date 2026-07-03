import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const USER_ID = '1eac61f7-5b90-434d-8b6e-983a41c73a9b';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const expectedToken = process.env.SECRET_API_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { url, folderId } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  if (folderId && typeof folderId !== 'string') {
    return NextResponse.json({ error: 'folderId must be a string' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let domain = '';
  let faviconUrl = '';
  try {
    const parsed = new URL(url);
    domain = parsed.hostname.replace('www.', '');
    faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {}

  const { data, error } = await supabase
    .from('items')
    .insert({
      user_id: USER_ID,
      url,
      folder_id: folderId || null,
      type: 'link',
      domain,
      favicon_url: faviconUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 200 });
}
