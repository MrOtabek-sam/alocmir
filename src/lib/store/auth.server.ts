import { bindings } from "../bindings.server";

const COOKIE = "alc_admin";
const MAX_AGE = 60 * 60 * 12;

function secret(): string | null {
  const env = bindings() as unknown as Record<string, unknown>;
  const v = env.ADMIN_PASSWORD;
  return typeof v === "string" && v.length >= 8 ? v : null;
}
export function adminConfigured(): boolean {
  return secret() !== null;
}

async function hmac(data: string, key: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function checkPassword(pw: string): Promise<boolean> {
  const s = secret();
  if (!s) return false;
  const [a, b] = await Promise.all([hmac(pw, "cmp"), hmac(s, "cmp")]);
  return safeEqual(a, b);
}

export async function makeSessionCookie(): Promise<string> {
  const s = secret()!;
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const token = `${exp}.${await hmac(String(exp), s)}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}
export function clearSessionCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const s = secret();
  if (!s) return false;
  const raw = request.headers.get("cookie") ?? "";
  const m = raw.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!m) return false;
  const token = m.slice(COOKIE.length + 1);
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(exp, s));
}
