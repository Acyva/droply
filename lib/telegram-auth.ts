import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebAppInitData {
  user?: TelegramUser;
  receiver?: TelegramUser;
  chat?: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    photo_url?: string;
  };
  auth_date: number;
  hash: string;
  start_param?: string;
  can_send_after?: number;
  chat_instance?: string;
  chat_type?: string;
  trigger_id?: string;
}

/**
 * Validate Telegram WebApp initData signature
 * This ensures the data came from Telegram
 */
export function validateTelegramWebAppData(
  initData: string,
  telegramBotToken: string
): { valid: boolean; data?: TelegramWebAppInitData } {
  try {
    const searchParams = new URLSearchParams(initData);
    const hash = searchParams.get('hash');

    if (!hash) {
      return { valid: false };
    }

    // Remove hash from params
    searchParams.delete('hash');

    // Create data check string
    const dataCheckString = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create HMAC SHA256
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(telegramBotToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Validate hash matches
    if (computedHash !== hash) {
      return { valid: false };
    }

    // Check if data is not too old (5 minutes)
    const authDate = parseInt(searchParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 5 * 60) {
      return { valid: false };
    }

    // Parse user data
    const userData = searchParams.get('user');
    if (!userData) {
      return { valid: false };
    }

    const user: TelegramUser = JSON.parse(userData);
    const data: TelegramWebAppInitData = {
      user,
      auth_date: authDate,
      hash,
      start_param: searchParams.get('start_param') || undefined,
    };

    return { valid: true, data };
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return { valid: false };
  }
}

/**
 * Get Telegram user ID from initData
 */
export function getTelegramUserId(initData: string, botToken: string): number | null {
  const { valid, data } = validateTelegramWebAppData(initData, botToken);
  if (!valid || !data?.user?.id) {
    return null;
  }
  return data.user.id;
}

/**
 * Create a Telegram user identifier (email-like)
 * Uses Telegram user ID as unique identifier
 */
export function createTelegramUserEmail(telegramId: number): string {
  return `telegram_${telegramId}@telegram.local`;
}

/**
 * Extract Telegram ID from email
 */
export function extractTelegramIdFromEmail(email: string): number | null {
  const match = email.match(/^telegram_(\d+)@telegram\.local$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}
