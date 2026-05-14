import { kv } from "@vercel/kv";

export async function rateLimit(opts: {
  key: string;
  max: number;
  window: number;
}): Promise<boolean> {
  try {
    const count = await kv.incr(opts.key);
    if (count === 1) await kv.expire(opts.key, opts.window);
    return count > opts.max;
  } catch (e) {
    console.warn("rateLimit: KV nicht verfügbar — skip", e);
    return false;
  }
}
