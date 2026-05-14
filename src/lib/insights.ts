import { kv } from "@vercel/kv";

/**
 * Insights-Tracking auf Basis von Vercel KV / Upstash Redis.
 * Sorted Sets pro Bucket, Score = Vorkommen. Daily-Counter zusätzlich.
 */

export type TrackEvent =
  | "search"
  | "search-no-result"
  | "article-view"
  | "bookmark"
  | "chat-open"
  | "escalation";

const K = {
  search: "ins:search",
  noResult: "ins:no-result",
  view: "ins:view",
  bookmark: "ins:bookmark",
  chat: "ins:chat",
  escalation: "ins:escalation",
  daily: (event: TrackEvent, date: string) => `ins:daily:${event}:${date}`,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeQuery(q: string): string {
  return q.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").trim().slice(0, 80);
}

export async function trackEvent(event: TrackEvent, value?: string) {
  try {
    const day = today();
    await kv.incr(K.daily(event, day));
    await kv.expire(K.daily(event, day), 60 * 60 * 24 * 90); // 90d Retention

    if (!value) return;
    const v = event === "search" || event === "search-no-result"
      ? normalizeQuery(value)
      : value.slice(0, 60);
    if (!v) return;

    let key: string | null = null;
    switch (event) {
      case "search": key = K.search; break;
      case "search-no-result": key = K.noResult; break;
      case "article-view": key = K.view; break;
      case "bookmark": key = K.bookmark; break;
      case "escalation": key = K.escalation; break;
      default: break;
    }
    if (key) {
      await kv.zincrby(key, 1, v);
    }
  } catch (e) {
    console.warn("trackEvent failed", e);
  }
}

export interface InsightsSnapshot {
  topSearches: Array<{ value: string; count: number }>;
  noResultSearches: Array<{ value: string; count: number }>;
  topViews: Array<{ value: string; count: number }>;
  topBookmarks: Array<{ value: string; count: number }>;
  escalationsByCategory: Array<{ value: string; count: number }>;
  daily: {
    search: number;
    view: number;
    bookmark: number;
    chat: number;
    escalation: number;
  };
}

async function topN(key: string, n: number): Promise<Array<{ value: string; count: number }>> {
  try {
    // zrange mit REV+WITHSCORES via Upstash @vercel/kv
    const raw = await kv.zrange(key, 0, n - 1, { rev: true, withScores: true }) as Array<string | number>;
    const out: Array<{ value: string; count: number }> = [];
    for (let i = 0; i < raw.length; i += 2) {
      out.push({ value: String(raw[i]), count: Number(raw[i + 1]) });
    }
    return out;
  } catch (e) {
    console.warn("topN failed for", key, e);
    return [];
  }
}

async function dailyCount(event: TrackEvent): Promise<number> {
  try { return Number(await kv.get(K.daily(event, today()))) ?? 0; }
  catch { return 0; }
}

function dayOffset(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

export async function loadDailySeries(event: TrackEvent, days = 7): Promise<number[]> {
  const keys = [];
  for (let i = days - 1; i >= 0; i--) keys.push(K.daily(event, dayOffset(i)));
  try {
    const values = await Promise.all(keys.map((k) => kv.get(k)));
    return values.map((v) => Number(v) || 0);
  } catch {
    return Array(days).fill(0);
  }
}

export async function loadAllSeries(days = 7) {
  const events: TrackEvent[] = ["search", "article-view", "bookmark", "chat-open", "escalation"];
  const series = await Promise.all(events.map((e) => loadDailySeries(e, days)));
  const out: Record<string, number[]> = {};
  events.forEach((e, i) => { out[e] = series[i]; });
  return out;
}

export async function loadInsights(): Promise<InsightsSnapshot> {
  const [topSearches, noResultSearches, topViews, topBookmarks, escalationsByCategory,
    dSearch, dView, dBookmark, dChat, dEsc] = await Promise.all([
    topN(K.search, 10),
    topN(K.noResult, 10),
    topN(K.view, 10),
    topN(K.bookmark, 10),
    topN(K.escalation, 10),
    dailyCount("search"),
    dailyCount("article-view"),
    dailyCount("bookmark"),
    dailyCount("chat-open"),
    dailyCount("escalation"),
  ]);
  return {
    topSearches, noResultSearches, topViews, topBookmarks, escalationsByCategory,
    daily: { search: dSearch, view: dView, bookmark: dBookmark, chat: dChat, escalation: dEsc },
  };
}
