"use client";

import { useState } from "react";
import { toast } from "sonner";
// version client-safe
import { formatMoney } from "@/lib/currency.client";

export default function BookingForm({
  listingId,
  price,
  currency,
}: {
  listingId: string;
  price: number;           // prix par nuit
  currency: "EUR" | "CAD"; // devise de l’annonce
}) {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const nights =
    start && end
      ? Math.max(
          0,
          Math.ceil(
            (new Date(end + "T00:00:00Z").getTime() -
              new Date(start + "T00:00:00Z").getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const total = Number((nights * price).toFixed(2));

  async function reserve() {
    if (!start || !end) {
      toast.error("Merci de choisir des dates");
      return;
    }
    setLoading(true);
    try {
      // 1) créer la réservation PENDING
      const r1 = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, startDate: start, endDate: end }),
      });
      const j1 = await r1.json().catch(() => ({}));
      if (!r1.ok) throw new Error(j1?.error || "Réservation impossible");

      const { bookingId, amount, currency: cur, hostUserId } = j1;

      // 2) créer la Session Stripe Checkout (meta copiées vers PI)
      const r2 = await fetch("/api/bookings/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount,
          currency: (cur as string).toLowerCase(), // "eur" | "cad"
          hostUserId,
        }),
      });
      const j2 = await r2.json().catch(() => ({}));
      if (!r2.ok || !j2?.url) throw new Error(j2?.error || "Paiement indisponible");

      // 3) redirection vers Stripe
      window.location.href = j2.url as string;
    } catch (e: any) {
      toast.error(e?.message ?? "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded border p-4 space-y-3">
      <div className="text-sm text-gray-700">
        {formatMoney(price, currency)} <span className="text-gray-500">/ nuit</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Arrivée</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Départ</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span>
          {nights} nuit{nights > 1 ? "s" : ""}
        </span>
        <span className="font-semibold">{formatMoney(total, currency)}</span>
      </div>

      <button
        type="button"
        onClick={reserve}
        disabled={loading}
        className="w-full rounded bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
      >
        {loading ? "Redirection Stripe…" : "Réserver et payer"}
      </button>
    </div>
  );
}
