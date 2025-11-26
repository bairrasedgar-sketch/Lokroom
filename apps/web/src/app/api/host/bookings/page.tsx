// apps/web/src/app/host/bookings/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HostBooking = {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  guest: {
    id: string;
    name: string | null;
    email: string | null;
  };
  listing: {
    id: string;
    title: string;
    images: { id: string; url: string }[];
  };
};

type ApiResponse = {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  items: HostBooking[];
};

export default function HostBookingsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtres UI
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  async function fetchBookings() {
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", String(page));

    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await fetch(`/api/host/bookings?${params.toString()}`);
    const json = (await res.json()) as ApiResponse;

    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    fetchBookings();
  }, [page, status, from, to]);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-semibold">Réservations de mes annonces</h1>

      {/* 🔍 Filtres */}
      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Status</label>
            <select
              className="rounded border px-2 py-1 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="PENDING">En attente</option>
              <option value="CONFIRMED">Confirmées</option>
              <option value="CANCELLED">Annulées</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Du</label>
            <input
              type="date"
              className="rounded border px-2 py-1 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Au</label>
            <input
              type="date"
              className="rounded border px-2 py-1 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Liste */}
      <section className="space-y-3">
        {loading && <p className="text-sm text-gray-600">Chargement…</p>}

        {!loading && data?.items.length === 0 && (
          <p className="text-sm text-gray-500">
            Aucune réservation pour ces filtres.
          </p>
        )}

        {!loading &&
          data?.items.map((b) => {
            const cover = b.listing.images?.[0]?.url;

            return (
              <div
                key={b.id}
                className="flex gap-3 rounded-lg border bg-white p-3"
              >
                <div className="relative h-20 w-28 overflow-hidden rounded bg-gray-100">
                  {cover ? (
                    <img
                      src={cover}
                      className="h-full w-full object-cover"
                      alt="cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-gray-400">
                      Pas d’image
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between flex-1">
                  <div className="space-y-1">
                    <Link
                      href={`/listings/${b.listing.id}`}
                      className="font-medium hover:underline"
                    >
                      {b.listing.title}
                    </Link>

                    <p className="text-xs text-gray-600">
                      {new Date(b.startDate).toLocaleDateString()} →{" "}
                      {new Date(b.endDate).toLocaleDateString()}
                    </p>

                    <p className="text-xs text-gray-600">
                      Client : {b.guest.name ?? b.guest.email ?? "—"}
                    </p>

                    <p className="text-xs text-gray-600">
                      Statut :{" "}
                      <span className="font-medium">{b.status}</span>
                    </p>
                  </div>

                  <p className="text-xs text-gray-400">
                    Créée le{" "}
                    {new Date(b.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
      </section>

      {/* Pagination */}
      {data && data.pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
            onClick={() => setPage((p) => p - 1)}
          >
            ← Précédent
          </button>

          <p className="text-xs text-gray-600">
            Page {data.page} / {data.pageCount}
          </p>

          <button
            disabled={page >= data.pageCount}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant →
          </button>
        </div>
      )}
    </main>
  );
}
