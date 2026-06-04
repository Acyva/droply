import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PendingItem {
  step: "folder" | "tags" | "notes";
  type: string;
  title: string;
  url: string;
  description: string;
  personal_notes: string;
  photo_url: string;
  folder_id: string;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  location_address: string | null;
}

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: { id: number; type: string };
  text?: string;
  photo?: Array<{ file_id: string; file_size: number; width: number; height: number }>;
  document?: { file_id: string; file_name?: string; mime_type?: string };
  caption?: string;
  location?: { latitude: number; longitude: number };
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

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) return;
  const body: any = { chat_id: chatId, text, parse_mode: "Markdown" };
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

function getSupabase() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function getOrCreatePendingItem(telegramId: number): Promise<PendingItem | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("telegram_pending_items")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  return data as PendingItem | null;
}

async function savePendingItem(telegramId: number, item: PendingItem) {
  const supabase = getSupabase();
  await supabase
    .from("telegram_pending_items")
    .upsert({ telegram_id: telegramId, ...item }, { onConflict: "telegram_id" });
}

async function deletePendingItem(telegramId: number) {
  const supabase = getSupabase();
  await supabase
    .from("telegram_pending_items")
    .delete()
    .eq("telegram_id", telegramId);
}

async function saveItemToDb(telegramId: number, item: PendingItem, chatId: number) {
  const supabase = getSupabase();

  const { data: telegramUser } = await supabase
    .from("telegram_users")
    .select("auth_id")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (!telegramUser) {
    await sendMessage(chatId, "You need to sign up first. Open the Mini App to create your account: /app");
    return;
  }

  let domain = "";
  let faviconUrl = "";
  if (item.url) {
    try {
      const u = new URL(item.url);
      domain = u.hostname.replace("www.", "");
      faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {}
  }

  const itemData: any = {
    user_id: telegramUser.auth_id,
    type: item.type,
    title: item.title,
    url: item.url || "",
    description: item.description || "",
    personal_notes: item.personal_notes || "",
    domain,
    favicon_url: faviconUrl,
    folder_id: item.folder_id || null,
    preview_image_url: item.photo_url || "",
  };

  if (item.latitude != null) {
    itemData.latitude = item.latitude;
    itemData.longitude = item.longitude;
    itemData.location_name = item.location_name;
    itemData.location_address = item.location_address;
  }

  const { data: created, error } = await supabase
    .from("items")
    .insert(itemData)
    .select()
    .single();

  if (error || !created) {
    console.error("Failed to save item:", error);
    await sendMessage(chatId, "Failed to save. Try again later.");
    return;
  }

  if (item.tags.length > 0) {
    await supabase.from("item_tags").insert(
      item.tags.map(tag_id => ({ item_id: created.id, tag_id }))
    );
  }

  await sendMessage(chatId, `Saved!\n\n*${item.title}*\n${item.tags.length ? `Tags: ${item.tags.length}` : ""}\n\nOpen in app: /app`);
  await deletePendingItem(telegramId);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();

    // Handle callback queries
    if (update.callback_query) {
      const { id: callbackId, from, data, message } = update.callback_query;
      await answerCallbackQuery(callbackId);
      if (!data || !from || !message) return new Response("OK", { status: 200 });

      const telegramId = from.id;
      const conv = await getOrCreatePendingItem(telegramId);
      if (!conv) {
        await sendMessage(message.chat.id, "Session expired. Send content again to start over.");
        return new Response("OK", { status: 200 });
      }

      if (conv.step === "folder") {
        if (data === "skip_folder") {
          conv.folder_id = "";
        } else if (data.startsWith("folder_")) {
          conv.folder_id = data.replace("folder_", "");
        }
        conv.step = "tags";

        // Get user tags
        const supabase = getSupabase();
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
            await savePendingItem(telegramId, conv);
            await sendMessage(message.chat.id, "Select tags (or skip):", { inline_keyboard: tagButtons });
            return new Response("OK", { status: 200 });
          }
        }

        // No tags, skip to notes
        conv.step = "notes";
        await savePendingItem(telegramId, conv);
        await sendMessage(message.chat.id, "Add notes? Type your notes or send `-` to skip:");
        return new Response("OK", { status: 200 });
      }

      if (conv.step === "tags") {
        if (data === "skip_tags") {
          conv.step = "notes";
          await savePendingItem(telegramId, conv);
          await sendMessage(message.chat.id, "Add notes? Type your notes or send `-` to skip:");
        } else if (data.startsWith("tag_")) {
          if (!conv.tags) conv.tags = [];
          if (!conv.tags.includes(data.replace("tag_", ""))) {
            conv.tags.push(data.replace("tag_", ""));
          }
          await savePendingItem(telegramId, conv);
          await sendMessage(message.chat.id, "Select more tags or type `done` to finish:", {
            inline_keyboard: [
              [{ text: "Done tagging", callback_data: "tags_done" }],
              [{ text: "Skip notes", callback_data: "skip_notes" }],
            ],
          });
        } else if (data === "tags_done") {
          conv.step = "notes";
          await savePendingItem(telegramId, conv);
          await sendMessage(message.chat.id, "Add notes? Type your notes or send `-` to skip:");
        } else if (data === "skip_notes") {
          await saveItemToDb(telegramId, conv, message.chat.id);
        }
        return new Response("OK", { status: 200 });
      }
    }

    // Handle regular messages
    if (!update.message || !update.message.from) return new Response("OK", { status: 200 });

    const msg = update.message;
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const text = msg.text || msg.caption || "";

    // /start command
    if (text.startsWith("/start")) {
      await sendMessage(chatId, "Welcome to *droply*!\n\nSend me a link, text, photo, or document and I'll save it to your vault.\n\nOpen the Mini App: /app");
      return new Response("OK", { status: 200 });
    }

    // /app command
    if (text === "/app") {
      const miniAppUrl = Deno.env.get("MINI_APP_URL") || "https://droply.app";
      await sendMessage(chatId, "Open droply:", {
        inline_keyboard: [[{ text: "Open droply", web_app: { url: miniAppUrl } }]],
      });
      return new Response("OK", { status: 200 });
    }

    // /help command
    if (text === "/help") {
      await sendMessage(chatId, "*droply bot commands:*\n\n- Send any link, text, photo, or document to save it\n- I'll ask which folder and tags to use\n- /app - Open the full Mini App\n- /start - Welcome message");
      return new Response("OK", { status: 200 });
    }

    // Handle ongoing conversation (notes step)
    const conv = await getOrCreatePendingItem(telegramId);
    if (conv && conv.step === "notes") {
      if (text !== "-") {
        conv.personal_notes = text;
      }
      await saveItemToDb(telegramId, conv, chatId);
      return new Response("OK", { status: 200 });
    }

    if (conv && conv.step === "tags" && text.toLowerCase() === "done") {
      conv.step = "notes";
      await savePendingItem(telegramId, conv);
      await sendMessage(chatId, "Add notes? Type your notes or send `-` to skip:");
      return new Response("OK", { status: 200 });
    }

    // New content - start conversation
    const supabase = getSupabase();
    const { data: telegramUser } = await supabase
      .from("telegram_users")
      .select("auth_id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (!telegramUser) {
      await sendMessage(chatId, "You need to sign up first. Open the Mini App to create your account: /app");
      return new Response("OK", { status: 200 });
    }

    // Determine content type
    let contentType = "note";
    let title = text.substring(0, 200);
    let url = "";
    let description = "";
    let photoUrl = "";
    let latitude: number | null = null;
    let longitude: number | null = null;

    // Location sharing
    if (msg.location) {
      contentType = "place";
      latitude = msg.location.latitude;
      longitude = msg.location.longitude;
      title = "Shared Location";
    } else {
      // Check if it's a URL
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urlMatch = text.match(urlRegex);
      if (urlMatch) {
        contentType = "link";
        url = urlMatch[0];
        title = text.replace(url, "").trim() || url;
        description = text.replace(url, "").trim();
      }

      // Photo
      if (msg.photo && msg.photo.length > 0) {
        contentType = "custom";
        title = msg.caption || "Photo";
        const largestPhoto = msg.photo[msg.photo.length - 1];
        photoUrl = (await getFileUrl(largestPhoto.file_id)) || "";
      }

      // Document
      if (msg.document) {
        contentType = "custom";
        title = msg.document.file_name || "Document";
        description = msg.caption || "";
      }
    }

    const pendingItem: PendingItem = {
      step: "folder",
      type: contentType,
      title,
      url,
      description,
      personal_notes: "",
      photo_url: photoUrl,
      folder_id: "",
      tags: [],
      latitude,
      longitude,
      location_name: null,
      location_address: null,
    };

    // Get user's folders
    const { data: userFolders } = await supabase
      .from("folders")
      .select("id, name")
      .eq("user_id", telegramUser.auth_id)
      .order("name");

    const folderButtons = (userFolders || []).map(f => ([{
      text: f.name,
      callback_data: `folder_${f.id}`,
    }]));
    folderButtons.push([{ text: "No folder", callback_data: "skip_folder" }]);

    await savePendingItem(telegramId, pendingItem);
    await sendMessage(chatId, `Where should I save this?\n\n*${title.substring(0, 50)}*`, {
      inline_keyboard: folderButtons,
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});
