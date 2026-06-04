import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import crypto from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
  photo?: Array<{ file_id: string; file_size: number; width: number; height: number }>;
  document?: { file_id: string; file_name?: string; mime_type?: string };
  caption?: string;
  reply_to_message?: TelegramMessage;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: { id: number; username?: string; first_name: string };
    message?: TelegramMessage;
    data?: string;
  };
}

// In-memory state for conversations (per Deno isolate)
const conversations = new Map<number, {
  step: 'folder' | 'tags' | 'notes' | 'done';
  content: {
    type: string;
    title: string;
    url?: string;
    description?: string;
    folder_id?: string;
    tags?: string[];
    personal_notes?: string;
    photo_url?: string;
  };
}>();

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) return;

  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function answerCallbackQuery(callbackQueryId: string) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) return;

  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  });
}

async function getFileUrl(fileId: string): Promise<string | null> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) return null;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
  const data = await res.json();
  if (data.ok && data.result?.file_path) {
    return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Verify webhook secret
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    const expectedSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");

    if (expectedSecret && secret !== expectedSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const update: TelegramUpdate = await req.json();

    // Handle callback queries (inline button presses)
    if (update.callback_query) {
      const { id: callbackId, from, data, message } = update.callback_query;
      await answerCallbackQuery(callbackId);

      if (!data || !from || !message) {
        return new Response("OK", { status: 200 });
      }

      const telegramId = from.id;
      const conv = conversations.get(telegramId);

      if (!conv) {
        await sendMessage(message.chat.id, "Session expired. Send content again to start over.");
        return new Response("OK", { status: 200 });
      }

      if (conv.step === "folder") {
        if (data === "skip_folder") {
          conv.step = "tags";
        } else if (data.startsWith("folder_")) {
          conv.content.folder_id = data.replace("folder_", "");
          conv.step = "tags";
        }

        // Ask about tags
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

        const { data: telegramUser } = await supabase
          .from("telegram_users")
          .select("auth_id")
          .eq("telegram_id", telegramId)
          .maybeSingle();

        if (telegramUser) {
          const { data: userTags } = await supabase
            .from("tags")
            .select("id, name, color")
            .eq("user_id", telegramUser.auth_id);

          if (userTags && userTags.length > 0) {
            const tagButtons = userTags.map(t => ([{ text: t.name, callback_data: `tag_${t.id}` }]));
            tagButtons.push([{ text: "Skip tags", callback_data: "skip_tags" }]);

            await sendMessage(message.chat.id, "🏷 Select tags (or skip):", {
              inline_keyboard: tagButtons,
            });
          } else {
            conv.step = "notes";
            await sendMessage(message.chat.id, "📝 Add notes? Type your notes or send `-` to skip:");
          }
        }
      } else if (conv.step === "tags") {
        if (data === "skip_tags") {
          conv.step = "notes";
          await sendMessage(message.chat.id, "📝 Add notes? Type your notes or send `-` to skip:");
        } else if (data.startsWith("tag_")) {
          if (!conv.content.tags) conv.content.tags = [];
          conv.content.tags.push(data.replace("tag_", ""));
          // Keep asking for more tags or move to notes
          await sendMessage(message.chat.id, "Select more tags or type `done` to finish tagging:", {
            inline_keyboard: [
              [{ text: "Done tagging", callback_data: "tags_done" }],
              [{ text: "Skip notes", callback_data: "skip_notes" }],
            ],
          });
        } else if (data === "tags_done") {
          conv.step = "notes";
          await sendMessage(message.chat.id, "📝 Add notes? Type your notes or send `-` to skip:");
        } else if (data === "skip_notes") {
          // Save the item
          await saveItem(telegramId, conv, message.chat.id);
        }
      }

      return new Response("OK", { status: 200 });
    }

    // Handle regular messages
    if (!update.message || !update.message.from) {
      return new Response("OK", { status: 200 });
    }

    const msg = update.message;
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const text = msg.text || msg.caption || "";

    // Handle /start command
    if (text.startsWith("/start")) {
      await sendMessage(chatId, "👋 Welcome to *droply*!\n\nSend me a link, text, photo, or document and I'll save it to your vault.\n\nOpen the Mini App: /app");
      return new Response("OK", { status: 200 });
    }

    // Handle /app command
    if (text === "/app") {
      const miniAppUrl = Deno.env.get("MINI_APP_URL") || "https://droply.app";
      await sendMessage(chatId, "📱 Open droply:", {
        inline_keyboard: [[{ text: "Open droply", web_app: { url: miniAppUrl } }]],
      });
      return new Response("OK", { status: 200 });
    }

    // Handle conversation steps
    const conv = conversations.get(telegramId);

    if (conv && conv.step === "notes") {
      if (text !== "-") {
        conv.content.personal_notes = text;
      }

      // Save the item
      await saveItem(telegramId, conv, chatId);
      conversations.delete(telegramId);
      return new Response("OK", { status: 200 });
    }

    if (conv && conv.step === "tags") {
      if (text.toLowerCase() === "done") {
        conv.step = "notes";
        await sendMessage(chatId, "📝 Add notes? Type your notes or send `-` to skip:");
        return new Response("OK", { status: 200 });
      }
    }

    // New content - start conversation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Find or create user
    const { data: telegramUser } = await supabase
      .from("telegram_users")
      .select("auth_id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (!telegramUser) {
      await sendMessage(chatId, "⚠️ You need to sign up first. Open the Mini App to create your account: /app");
      return new Response("OK", { status: 200 });
    }

    // Determine content type
    let contentType = "note";
    let title = text.substring(0, 200);
    let url: string | undefined;
    let description: string | undefined;
    let photoUrl: string | undefined;

    // Check if it's a URL
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urlMatch = text.match(urlRegex);
    if (urlMatch) {
      contentType = "link";
      url = urlMatch[0];
      title = text.replace(url, "").trim() || url;
      description = text.replace(url, "").trim() || undefined;
    }

    // Check if it's a photo
    if (msg.photo && msg.photo.length > 0) {
      contentType = "custom";
      title = msg.caption || "Photo";
      const largestPhoto = msg.photo[msg.photo.length - 1];
      photoUrl = await getFileUrl(largestPhoto.file_id);
    }

    // Check if it's a document
    if (msg.document) {
      contentType = "custom";
      title = msg.document.file_name || "Document";
      description = msg.caption || undefined;
    }

    // Check for location sharing
    if ((msg as any).location) {
      contentType = "place";
      const loc = (msg as any).location;
      conversations.set(telegramId, {
        step: "folder",
        content: {
          type: contentType,
          title: "Shared Location",
          latitude: loc.latitude,
          longitude: loc.longitude,
        } as any,
      });
    } else {
      // Start the folder selection conversation
      conversations.set(telegramId, {
        step: "folder",
        content: {
          type: contentType,
          title,
          url,
          description,
          photo_url: photoUrl,
        },
      });
    }

    // Get user's folders for selection
    const { data: userFolders } = await supabase
      .from("folders")
      .select("id, name, icon, color")
      .eq("user_id", telegramUser.auth_id)
      .order("name");

    const folderButtons = (userFolders || []).map(f => ([{
      text: `${f.name}`,
      callback_data: `folder_${f.id}`,
    }]));

    folderButtons.push([{ text: "No folder", callback_data: "skip_folder" }]);

    await sendMessage(chatId, `📁 Where should I save this?\n\n*${title.substring(0, 50)}*`, {
      inline_keyboard: folderButtons,
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});

async function saveItem(telegramId: number, conv: typeof conversations extends Map<number, infer V> ? V : never, chatId: number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  const { data: telegramUser } = await supabase
    .from("telegram_users")
    .select("auth_id")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (!telegramUser) {
    await sendMessage(chatId, "❌ User not found. Please sign up first: /app");
    return;
  }

  const content = conv.content;
  let domain = "";
  let faviconUrl = "";

  if (content.url) {
    try {
      const u = new URL(content.url);
      domain = u.hostname.replace("www.", "");
      faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {}
  }

  const itemData: any = {
    user_id: telegramUser.auth_id,
    type: content.type,
    title: content.title,
    url: content.url || "",
    description: content.description || "",
    personal_notes: content.personal_notes || "",
    domain,
    favicon_url: faviconUrl,
    folder_id: content.folder_id || null,
    preview_image_url: content.photo_url || "",
  };

  // Add location data if present
  if (content.latitude != null) {
    itemData.latitude = content.latitude;
    itemData.longitude = content.longitude;
    itemData.location_name = content.location_name;
    itemData.location_address = content.location_address;
  }

  const { data: item, error } = await supabase
    .from("items")
    .insert(itemData)
    .select()
    .single();

  if (error || !item) {
    console.error("Failed to save item:", error);
    await sendMessage(chatId, "❌ Failed to save. Try again later.");
    return;
  }

  // Set tags if any
  if (content.tags && content.tags.length > 0) {
    const tagInserts = content.tags.map(tag_id => ({
      item_id: item.id,
      tag_id,
    }));
    await supabase.from("item_tags").insert(tagInserts);
  }

  const folderInfo = content.folder_id ? " in folder" : "";
  await sendMessage(chatId, `✅ Saved${folderInfo}!\n\n*${content.title}*\n${content.tags?.length ? `🏷 Tags: ${content.tags.length}` : ""}\n\nOpen in app: /app`);
  conversations.delete(telegramId);
}
