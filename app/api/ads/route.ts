import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const GRAPH = "https://graph.facebook.com/v20.0";

function getToken(): string {
  const token = process.env.META_ACCESS_TOKEN ?? process.env.FB_USER_TOKEN_LONG;
  if (!token) throw new Error("META_ACCESS_TOKEN/FB_USER_TOKEN_LONG ausente no ambiente");
  return token;
}

// aceita "BR" ou '["BR","US"]'
function normalizeCountries(param: string | null): string {
  if (!param || param === "all") return '["BR"]';
  try {
    const parsed = JSON.parse(decodeURIComponent(param));
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return JSON.stringify(parsed.map((c) => c.toUpperCase()));
    }
  } catch {}
  if (/^[A-Z]{2}$/i.test(param)) return JSON.stringify([param.toUpperCase()]);
  return '["BR"]';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "oferta").trim();
    const countries = normalizeCountries(searchParams.get("countries"));
    const limit = Math.max(1, Math.min(25, Number(searchParams.get("limit") ?? 10)));
    const after = searchParams.get("after") ?? undefined;

    // fields ENXUTOS (evita 400 esquisito)
    const fields = ["id", "page_id", "page_name", "ad_delivery_start_time"].join(",");

    const url = new URL(`${GRAPH}/ads_archive`);
    url.searchParams.set("access_token", getToken());
    url.searchParams.set("ad_reached_countries", countries);
    url.searchParams.set("search_terms", q);
    url.searchParams.set("ad_type", "ALL");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("fields", fields);
    if (after) url.searchParams.set("after", after);

    const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const raw = await res.json();

    if (!res.ok) {
      return NextResponse.json({ meta_error: raw?.error ?? raw }, { status: res.status });
    }

    const data = (raw.data ?? []).map((ad: any) => ({
      id: ad.id,
      page_id: ad.page_id,
      page_name: ad.page_name,
      ad_delivery_start_time: ad.ad_delivery_start_time,
      page_picture_url: ad.page_id
        ? `https://graph.facebook.com/v20.0/${ad.page_id}/picture?type=large`
        : null,
      ad_snapshot_url_public: `https://www.facebook.com/ads/library/?id=${ad.id}`,
    }));

    return NextResponse.json({ data, paging: raw.paging ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 });
  }
}
