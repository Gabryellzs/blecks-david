import { NextResponse } from "next/server";

const GRAPH = "https://graph.facebook.com/v20.0";

function getToken(): string {
  const token = process.env.META_ACCESS_TOKEN ?? process.env.FB_USER_TOKEN_LONG;
  if (!token) {
    throw new Error("Missing META_ACCESS_TOKEN or FB_USER_TOKEN_LONG");
  }
  return token;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") ?? "oferta";
    const countries = searchParams.get("countries") ?? '["BR"]'; // array JSON (ex.: ["BR","US"])
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
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data?.error ?? data }, { status: res.status });
    }

    // Remover qualquer possibilidade de vazar token nas URLs retornadas
    const cleaned = (data.data ?? []).map((ad: any) => ({
      ...ad,
      ad_snapshot_url_public: `https://www.facebook.com/ads/library/?id=${ad.id}`,
      // não retornamos ad_snapshot_url com access_token
    }));

    return NextResponse.json({
      data: cleaned,
      paging: data.paging ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 });
  }
}
