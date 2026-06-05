import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import crypto from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

function validateTelegramData(
  initData: string,
  botToken: string
): { valid: boolean; user?: TelegramUser } {
  try {
    const searchParams = new URLSearchParams(initData);
    const hash = searchParams.get("hash");
    if (!hash) return { valid: false };

    searchParams.delete("hash");

    const dataCheckString = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (computedHash !== hash) return { valid: false };

    // Allow up to 24 hours to handle clock drift and cached mini app opens
    const authDate = parseInt(searchParams.get("auth_date") || "0", 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) return { valid: false };

    const userData = searchParams.get("user");
    if (!userData) return { valid: false };

    const user: TelegramUser = JSON.parse(userData);
    return { valid: true, user };
  } catch (error) {
    console.error("Error validating Telegram data:", error);
    return { valid: false };
  }
}

function derivePassword(telegramId: number, botToken: string): string {
  // Stable deterministic password: HMAC(botToken, telegramId)
  return crypto.createHmac("sha256", botToken).update(String(telegramId)).digest("hex");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { initData } = await req.json();
    if (!initData) {
      return new Response(
        JSON.stringify({ error: "Missing initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { valid, user } = validateTelegramData(initData, botToken);
    if (!valid || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid Telegram data" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = `telegram_${user.id}@droply.tg`;
    const password = derivePassword(user.id, botToken);

    // Check if user already exists in telegram_users
    const { data: existingTgUser } = await supabase
      .from("telegram_users")
      .select("auth_id")
      .eq("telegram_id", user.id)
      .maybeSingle();

    let authId: string;
    let isNewUser = false;

    if (existingTgUser) {
      authId = existingTgUser.auth_id;
    } else {
      // Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: user.id,
          telegram_username: user.username,
          name: user.first_name + (user.last_name ? ` ${user.last_name}` : ""),
          avatar_url: user.photo_url,
        },
      });

      if (signUpError || !signUpData?.user?.id) {
        console.error("Failed to create user:", signUpError);
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      authId = signUpData.user.id;
      isNewUser = true;

      await supabase.from("telegram_users").insert({
        auth_id: authId,
        telegram_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name || null,
        username: user.username || null,
        photo_url: user.photo_url || null,
      });

      await supabase.rpc("create_default_folders_for_user", { p_user_id: authId });
    }

    // Sign in with the derived password to get a real session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData?.session) {
      console.error("Failed to sign in:", signInError);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        user: signInData.user,
        is_new_user: isNewUser,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Telegram auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
