import { NextResponse } from "next/server";

export const runtime = "nodejs";        // garante Node runtime no Vercel
export const dynamic = "force-dynamic"; // evita cache estático da rota
export const revalidate = 0;

const GRAPH = "https://graph.facebook.com/v20.0";

function getToken(): string {
  const token = process.env.META_ACCESS_TOKEN ?? process.env.FB_USER_TOKEN_LONG;
  if (!token) throw new Error("META_ACCESS_TOKEN/FB_USER_TOKEN_LONG ausente no ambiente");
  return token;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "oferta";
    const countries = searchParams.get("countries") ?? '["BR"]';
    const adType = searchParams.get("ad_type") ?? "ALL";
    const limit = searchParams.get("limit") ?? "10";
    const after = searchParams.get("after") ?? undefined;

    const url = new URL(`${GRAPH}/ads_archive`);
    url.searchParams.set("access_token", getToken());
    url.searchParams.set("ad_reached_countries", countries);
    url.searchParams.set("search_terms", q);
    url.searchParams.set("ad_type", adType);
    url.searchParams.set("limit", limit);
    if (after) url.searchParams.set("after", after);

    const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const raw = await res.json();

    if (!res.ok) {
      console.error("[/api/ads] Meta error:", raw);
      return NextResponse.json({ error: raw?.error ?? raw }, { status: res.status });
    }

    const safeData = (raw.data ?? []).map((ad: any) => ({
      id: ad.id,
      page_id: ad.page_id,
      ad_delivery_start_time: ad.ad_delivery_start_time,
      ad_snapshot_url_public: `https://www.facebook.com/ads/library/?id=${ad.id}`,
    }));

    return NextResponse.json({ data: safeData, paging: raw.paging ?? null });
  } catch (e: any) {
    console.error("[/api/ads] Server error:", e);
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 });
  }
}
