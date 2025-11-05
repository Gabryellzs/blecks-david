"use client";
import { useEffect, useState } from "react";

type AdItem = {
  id: string;
  page_id?: string;
  ad_delivery_start_time?: string;
  ad_snapshot_url_public: string;
};

export default function AdsList() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchAds(cursor?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("q", "oferta");
    params.set("countries", '["BR"]');
    params.set("ad_type", "ALL");
    params.set("limit", "10");
    if (cursor) params.set("after", cursor);

    const res = await fetch(`/api/ads?${params.toString()}`);
    const json = await res.json();
    setLoading(false);

    if (json?.data) {
      setAds(prev => [...prev, ...json.data]);
      setAfter(json?.paging?.cursors?.after ?? null);
    } else {
      console.error(json?.error ?? "Erro desconhecido");
    }
  }

  useEffect(() => {
    fetchAds();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Anúncios (Ad Library)</h2>

      {ads.map(ad => (
        <div key={ad.id} className="rounded border p-3">
          <div>ID: {ad.id}</div>
          <div>Page: {ad.page_id ?? "-"}</div>
          <div>Início: {ad.ad_delivery_start_time ?? "-"}</div>
          <a
            href={ad.ad_snapshot_url_public}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            Ver no Ad Library
          </a>
        </div>
      ))}

      <button
        onClick={() => fetchAds(after ?? undefined)}
        disabled={loading || !after}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {after ? (loading ? "Carregando..." : "Carregar mais") : "Sem mais resultados"}
      </button>
    </div>
  );
}
