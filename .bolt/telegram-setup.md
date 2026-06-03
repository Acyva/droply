# Telegram Mini App Authentication Setup

This guide explains how to set up and deploy droply as a Telegram Mini App with automatic authentication.

## Overview

The Telegram Mini App integration provides:
- **Automatic authentication** using Telegram WebApp initData
- **User auto-creation** on first launch
- **Persistent login** - users stay logged in automatically
- **Profile storage** - Telegram user ID, username, first name, and photo are saved
- **Security** - All Telegram data is validated server-side using HMAC-SHA256

## Bot Setup

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Choose a bot name and username
4. You'll receive an API token (keep it secret!)

### 2. Enable Mini Apps

1. Message @BotFather again
2. Select your bot
3. Send `/setmenubutton`
4. Follow instructions to set a menu button that opens your Mini App

### 3. Configure the Web App URL

1. With your bot selected in @BotFather
2. Send `/setdefaultadministratorchunks` or use the Bot API to set:
   - `web_app_url`: Your Mini App URL (e.g., `https://yourapp.com`)

## Environment Variables

Add the following to your `.env.local`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

The bot token is used by the `telegram-auth` edge function to validate incoming Telegram data.

## How It Works

### Authentication Flow

```
1. User opens Mini App in Telegram
2. Telegram WebApp JavaScript loads and provides initData
3. AuthContext detects Telegram environment
4. If no existing session, automatically calls telegram-auth edge function
5. Edge function validates Telegram initData signature
6. If valid:
   - Check if user exists (by Telegram ID)
   - If new user: create auth user + store Telegram profile
   - If existing: use existing auth
7. Session is established automatically
8. User is logged in with persistent session
```

### Manual Telegram Sign-In

Users can also manually sign in via Telegram button when not in the Telegram app.

### Data Storage

Telegram user data is stored in `telegram_users` table:

```sql
- auth_id (UUID) - Links to auth.users
- telegram_id (bigint) - Unique Telegram user ID
- first_name (text) - User's first name
- last_name (text) - User's last name (nullable)
- username (text) - Telegram username (nullable)
- photo_url (text) - Telegram profile photo URL (nullable)
```

### Security

- HMAC-SHA256 validation of Telegram initData
- 5-minute freshness check on auth data
- Row-level security on telegram_users table
- Only service_role can create/update during auth
- Users can only view their own profile

## Deployment

### Deploy Edge Function

The `telegram-auth` edge function is deployed to handle authentication:

```bash
supabase functions deploy telegram-auth
```

### Set Bot Token Secret

After deployment, configure the bot token in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Edge Functions > Secrets
3. Add: `TELEGRAM_BOT_TOKEN` = your bot token

The function automatically has access to:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

## Testing Locally

### With Telegram Bot API

1. Get your bot token from @BotFather
2. In development, set `TELEGRAM_BOT_TOKEN` in `.env.local`
3. Use ngrok or similar to expose your local dev server
4. Configure Mini App URL in @BotFather to point to your ngrok URL

### Without Telegram (for testing)

The auth page detects if running in a Telegram environment:
- Inside Telegram Mini App: Shows Telegram login button
- Outside (browser): Shows email/password form

## API Endpoint

### POST /functions/v1/telegram-auth

**Request:**
```json
{
  "initData": "user=%7B%22id%22%3A123456789..."
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "sbv3c2f7eec3f...",
  "user": {
    "id": "uuid",
    "email": "telegram_123456789@telegram.local",
    "user_metadata": { ... }
  }
}
```

**Error Response (401/500):**
```json
{
  "error": "Invalid Telegram data" | "Server configuration error" | etc
}
```

## User Experience

### First Launch
- User opens Mini App
- App automatically authenticates via Telegram
- User's profile is created if new
- Redirected to main app

### Subsequent Launches
- User opens Mini App
- Session is automatically restored
- No login needed

### Data Collected
- Telegram ID (primary key)
- First name
- Last name (if set)
- Username (if set)
- Profile photo URL

## Debugging

### Check Telegram Data Validation

The validation process:
1. Extracts hash from initData
2. Sorts remaining parameters alphabetically
3. Creates HMAC-SHA256 with WebAppData + botToken
4. Compares computed hash with provided hash
5. Validates auth_date is within 5 minutes

### Common Issues

**"Invalid Telegram data"**
- Bot token is wrong
- initData has been tampered with
- Auth data is older than 5 minutes
- Running outside Telegram Mini App

**"Failed to create user"**
- Supabase service role key not configured
- User with that email already exists
- Database error (check Supabase logs)

**"Failed to create session"**
- Service role key issue
- User creation succeeded but session creation failed
- Check Supabase logs for details

## Security Notes

- Never commit bot token to git
- Validate all Telegram data server-side (already done)
- Use HTTPS in production
- Keep bot token secret - it's the master key for your Mini App
- Revoke token if compromised by messaging @BotFather

## Future Enhancements

Possible additions:
- Store additional Telegram data (language_code, is_premium)
- Implement Telegram payments
- Use Telegram MainButton for main actions
- Implement Telegram context menu
- Add haptic feedback for interactions
