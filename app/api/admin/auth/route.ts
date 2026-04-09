import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';

function getAdminPortalPassword(): string {
  const password = process.env.ADMIN_PORTAL_PASSWORD || process.env.ADMIN_API_KEY;
  if (!password) {
    throw new Error('Missing ADMIN_PORTAL_PASSWORD or ADMIN_API_KEY in .env.local');
  }
  return password;
}

type TimeKeyConfig = {
  enabled: boolean;
  seed: string;
  modulus: number;
  dayDateModulus: number;
  windowMinutes: number;
};

function getTimeKeyConfig(): TimeKeyConfig {
  const enabled = process.env.ADMIN_TIME_KEY_ENABLED === 'true';
  const seed = process.env.ADMIN_TIME_KEY_SEED || '';
  const modulus = Number(process.env.ADMIN_TIME_KEY_MODULUS || '1000000');
  const dayDateModulus = Number(process.env.ADMIN_TIME_KEY_DAYDATE_MOD || '97');
  const windowMinutes = Number(process.env.ADMIN_TIME_KEY_WINDOW_MINUTES || '10');

  if (!enabled) {
    return {
      enabled,
      seed,
      modulus,
      dayDateModulus,
      windowMinutes,
    };
  }

  if (!seed) {
    throw new Error('ADMIN_TIME_KEY_ENABLED=true requires ADMIN_TIME_KEY_SEED in .env.local');
  }
  if (!Number.isFinite(modulus) || modulus <= 0) {
    throw new Error('ADMIN_TIME_KEY_MODULUS must be a positive number');
  }
  if (!Number.isFinite(dayDateModulus) || dayDateModulus <= 0) {
    throw new Error('ADMIN_TIME_KEY_DAYDATE_MOD must be a positive number');
  }
  if (!Number.isFinite(windowMinutes) || windowMinutes <= 0) {
    throw new Error('ADMIN_TIME_KEY_WINDOW_MINUTES must be a positive number');
  }

  return {
    enabled,
    seed,
    modulus,
    dayDateModulus,
    windowMinutes,
  };
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function toSeedNumber(seed: string, modulus: number): number {
  const hashHex = createHash('sha256').update(seed).digest('hex').slice(0, 12);
  return parseInt(hashHex, 16) % modulus;
}

function generateTimeKey(now: Date, config: TimeKeyConfig): string {
  const dayOfWeek = now.getUTCDay() + 1;
  const dayOfMonth = now.getUTCDate();
  const dayDateProduct = dayOfWeek * dayOfMonth;
  const dayDateFactor = dayDateProduct % config.dayDateModulus;

  const windowMs = config.windowMinutes * 60 * 1000;
  const timeWindow = Math.floor(now.getTime() / windowMs);
  const seedNumber = toSeedNumber(config.seed, config.modulus);
  const rolling = (seedNumber + (timeWindow % config.modulus) * dayDateFactor) % config.modulus;

  const width = String(config.modulus - 1).length;
  return String(rolling).padStart(width, '0');
}

function isValidPassword(enteredPassword: string): boolean {
  const staticPassword = getAdminPortalPassword();
  if (safeEqual(enteredPassword, staticPassword)) {
    return true;
  }

  const config = getTimeKeyConfig();
  if (!config.enabled) {
    return false;
  }

  const now = new Date();
  const windowMs = config.windowMinutes * 60 * 1000;
  const candidateTimes = [now, new Date(now.getTime() - windowMs), new Date(now.getTime() + windowMs)];

  return candidateTimes.some((candidate) => safeEqual(enteredPassword, generateTimeKey(candidate, config)));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { password?: string };
    const enteredPassword = typeof body.password === 'string' ? body.password : '';

    if (!enteredPassword) {
      return NextResponse.json({ detail: 'Password is required' }, { status: 400 });
    }

    if (!isValidPassword(enteredPassword)) {
      return NextResponse.json({ detail: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unexpected server error' },
      { status: 500 }
    );
  }
}
