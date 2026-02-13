// apps/web/src/components/PayPalButton.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/lib/logger";


// Types pour le SDK PayPal
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PayPalButtonsConfig) => {
        render: (container: HTMLElement | string) => Promise<void>;
        close: () => Promise<void>;
      };
    };
  }
}

interface PayPalButtonsConfig {
  style?: {
    layout?: "vertical" | "horizontal";
    color?: "gold" | "blue" | "silver" | "white" | "black";
    shape?: "rect" | "pill";
    label?: "paypal" | "checkout" | "buynow" | "pay" | "installment";
    height?: number;
  };
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string; payerID?: string }) => Promise<void>;
  onCancel?: (data: { orderID: string }) => void;
  onError?: (err: Error) => void;
}

interface PayPalButtonProps {
  bookingId: string;
  amountCents: number;
  currency: string;
  onSuccess?: (data: { bookingId: string; captureId: string }) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export default function PayPalButton({
  bookingId,
  amountCents,
  currency,
  onSuccess,
  onCancel,
  onError,
  disabled = false,
  className = "",
}: PayPalButtonProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const buttonsRendered = useRef(false);

  // Charger le SDK PayPal
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId) {
      setError("PayPal n'est pas configuré");
      setLoading(false);
      return;
    }

    // Vérifier si le SDK est déjà chargé
    if (window.paypal) {
      setSdkLoaded(true);
      setLoading(false);
      return;
    }

    // Charger le SDK
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&locale=fr_FR`;
    script.async = true;

    script.onload = () => {
      setSdkLoaded(true);
      setLoading(false);
    };

    script.onerror = () => {
      setError("Impossible de charger PayPal");
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Ne pas supprimer le script car il peut être réutilisé
    };
  }, [currency]);

  // Créer une commande PayPal
  const createOrder = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok || !data.orderId) {
        throw new Error(data.error || "Erreur lors de la création de la commande");
      }

      return data.orderId;
    } catch (err) {
      logger.error("[PayPal] Create order error", { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }, [bookingId]);

  // Capturer le paiement après approbation
  const onApprove = useCallback(
    async (data: { orderID: string; payerID?: string }) => {
      try {
        const response = await fetch("/api/payments/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderID }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Erreur lors de la capture du paiement");
        }

        toast.success("Paiement confirmé !");

        if (onSuccess) {
          onSuccess({
            bookingId: result.bookingId,
            captureId: result.captureId,
          });
        } else {
          // Redirection par défaut
          router.push("/bookings?paid=1");
        }
      } catch (err) {
        logger.error("[PayPal] Capture error", { error: err instanceof Error ? err.message : String(err) });
        toast.error("Erreur lors de la confirmation du paiement");
        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    },
    [bookingId, onSuccess, onError, router]
  );

  // Gérer l'annulation
  const handleCancel = useCallback(
    (data: { orderID: string }) => {
      logger.debug("[PayPal] Payment cancelled", { orderID: data.orderID });
      toast("Paiement annulé");
      if (onCancel) {
        onCancel();
      }
    },
    [onCancel]
  );

  // Gérer les erreurs
  const handleError = useCallback(
    (err: Error) => {
      logger.error("[PayPal] Button error", { error: err.message });
      setError("Une erreur est survenue avec PayPal");
      toast.error("Erreur PayPal");
      if (onError) {
        onError(err);
      }
    },
    [onError]
  );

  // Rendre les boutons PayPal
  useEffect(() => {
    if (!sdkLoaded || !window.paypal || !containerRef.current || disabled || buttonsRendered.current) {
      return;
    }

    buttonsRendered.current = true;

    const buttons = window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "pill",
        label: "paypal",
        height: 48,
      },
      createOrder,
      onApprove,
      onCancel: handleCancel,
      onError: handleError,
    });

    buttons.render(containerRef.current).catch((err) => {
      logger.error("[PayPal] Render error", { error: err instanceof Error ? err.message : String(err) });
      setError("Impossible d'afficher le bouton PayPal");
    });

    return () => {
      buttonsRendered.current = false;
    };
  }, [sdkLoaded, disabled, createOrder, onApprove, handleCancel, handleError]);

  // Formater le montant
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amountCents / 100);

  if (error) {
    return (
      <div className={`rounded-xl border border-red-200 bg-red-50 p-4 text-center ${className}`}>
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            buttonsRendered.current = false;
            setSdkLoaded(false);
          }}
          className="mt-2 text-xs text-red-700 underline hover:no-underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 animate-spin text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-gray-500">Chargement de PayPal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Container pour les boutons PayPal */}
      <div
        ref={containerRef}
        className={`min-h-[48px] ${disabled ? "pointer-events-none opacity-50" : ""}`}
      />

      {/* Info sur le montant */}
      <p className="mt-2 text-center text-xs text-gray-500">
        Montant total : <span className="font-medium">{formattedAmount}</span>
      </p>

      {/* Sécurité */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Paiement sécurisé par PayPal</span>
      </div>
    </div>
  );
}
