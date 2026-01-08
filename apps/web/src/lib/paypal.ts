// apps/web/src/lib/paypal.ts
/**
 * Configuration et utilitaires PayPal pour Lok'Room
 *
 * Ce module fournit toutes les fonctions nécessaires pour interagir avec l'API PayPal:
 * - Authentification OAuth2
 * - Création de commandes
 * - Capture de paiements
 * - Remboursements
 * - Vérification de webhooks
 */

// Configuration PayPal
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox"; // "sandbox" ou "live"
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

// URLs de base PayPal
const PAYPAL_BASE_URL = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// Types PayPal
export type PayPalOrderStatus =
  | "CREATED"
  | "SAVED"
  | "APPROVED"
  | "VOIDED"
  | "COMPLETED"
  | "PAYER_ACTION_REQUIRED";

export type PayPalCaptureStatus =
  | "COMPLETED"
  | "DECLINED"
  | "PARTIALLY_REFUNDED"
  | "PENDING"
  | "REFUNDED"
  | "FAILED";

export interface PayPalAmount {
  currency_code: string;
  value: string;
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  description?: string;
  custom_id?: string;
  invoice_id?: string;
  amount: PayPalAmount;
}

export interface PayPalOrder {
  id: string;
  status: PayPalOrderStatus;
  intent: "CAPTURE" | "AUTHORIZE";
  purchase_units: PayPalPurchaseUnit[];
  payer?: {
    payer_id: string;
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
  create_time?: string;
  update_time?: string;
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCapture {
  id: string;
  status: PayPalCaptureStatus;
  amount: PayPalAmount;
  final_capture: boolean;
  seller_protection?: {
    status: string;
    dispute_categories?: string[];
  };
  create_time?: string;
  update_time?: string;
}

export interface PayPalRefund {
  id: string;
  status: "CANCELLED" | "FAILED" | "PENDING" | "COMPLETED";
  amount?: PayPalAmount;
  create_time?: string;
  update_time?: string;
}

export interface PayPalWebhookEvent {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: Record<string, unknown>;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// Cache pour le token d'accès
let accessTokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

/**
 * Vérifie que les variables d'environnement PayPal sont configurées
 */
export function isPayPalConfigured(): boolean {
  return !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

/**
 * Obtient un token d'accès OAuth2 PayPal
 * Le token est mis en cache pour éviter les appels répétés
 */
export async function getAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials not configured");
  }

  // Vérifier le cache (avec 5 minutes de marge)
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return accessTokenCache.token;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[PayPal] Failed to get access token:", error);
    throw new Error(`PayPal authentication failed: ${response.status}`);
  }

  const data = await response.json() as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  // Mettre en cache le token
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Crée une commande PayPal
 *
 * @param amountCents - Montant en centimes
 * @param currency - Code devise (EUR, CAD, USD, etc.)
 * @param bookingId - ID de la réservation Lok'Room
 * @param description - Description de la commande
 */
export async function createOrder(params: {
  amountCents: number;
  currency: string;
  bookingId: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
}): Promise<PayPalOrder> {
  const { amountCents, currency, bookingId, description, returnUrl, cancelUrl } = params;

  const accessToken = await getAccessToken();

  // Convertir les centimes en unités (ex: 1234 cents -> "12.34")
  const amountValue = (amountCents / 100).toFixed(2);

  const orderPayload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: bookingId,
        description: description || `Réservation Lok'Room #${bookingId.slice(-8)}`,
        custom_id: bookingId,
        amount: {
          currency_code: currency.toUpperCase(),
          value: amountValue,
        },
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
          brand_name: "Lok'Room",
          locale: "fr-FR",
          landing_page: "LOGIN",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/bookings/paypal-return`,
          cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/bookings/paypal-cancel`,
        },
      },
    },
  };

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `lokroom-${bookingId}-${Date.now()}`, // Idempotence
    },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[PayPal] Failed to create order:", error);
    throw new Error(`PayPal order creation failed: ${response.status}`);
  }

  const order = await response.json() as PayPalOrder;

  console.log("[PayPal] Order created:", {
    orderId: order.id,
    status: order.status,
    bookingId,
    amountCents,
    currency,
  });

  return order;
}

/**
 * Capture une commande PayPal après approbation par le client
 *
 * @param orderId - ID de la commande PayPal
 */
export async function captureOrder(orderId: string): Promise<{
  order: PayPalOrder;
  capture: PayPalCapture | null;
}> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[PayPal] Failed to capture order:", error);
    throw new Error(`PayPal capture failed: ${response.status}`);
  }

  const order = await response.json() as PayPalOrder & {
    purchase_units: Array<{
      payments?: {
        captures?: PayPalCapture[];
      };
    }>;
  };

  const capture = order.purchase_units?.[0]?.payments?.captures?.[0] || null;

  console.log("[PayPal] Order captured:", {
    orderId: order.id,
    status: order.status,
    captureId: capture?.id,
    captureStatus: capture?.status,
  });

  return { order, capture };
}

/**
 * Récupère les détails d'une commande PayPal
 *
 * @param orderId - ID de la commande PayPal
 */
export async function getOrderDetails(orderId: string): Promise<PayPalOrder> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[PayPal] Failed to get order details:", error);
    throw new Error(`PayPal get order failed: ${response.status}`);
  }

  return await response.json() as PayPalOrder;
}

/**
 * Rembourse un paiement PayPal (total ou partiel)
 *
 * @param captureId - ID de la capture PayPal
 * @param amountCents - Montant à rembourser en centimes (optionnel, remboursement total si non spécifié)
 * @param currency - Code devise
 * @param reason - Raison du remboursement
 */
export async function refundCapture(params: {
  captureId: string;
  amountCents?: number;
  currency?: string;
  reason?: string;
}): Promise<PayPalRefund> {
  const { captureId, amountCents, currency, reason } = params;

  const accessToken = await getAccessToken();

  const refundPayload: Record<string, unknown> = {};

  // Si un montant est spécifié, c'est un remboursement partiel
  if (amountCents !== undefined && currency) {
    refundPayload.amount = {
      currency_code: currency.toUpperCase(),
      value: (amountCents / 100).toFixed(2),
    };
  }

  if (reason) {
    refundPayload.note_to_payer = reason;
  }

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `lokroom-refund-${captureId}-${Date.now()}`, // Idempotence
    },
    body: JSON.stringify(refundPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[PayPal] Failed to refund capture:", error);
    throw new Error(`PayPal refund failed: ${response.status}`);
  }

  const refund = await response.json() as PayPalRefund;

  console.log("[PayPal] Capture refunded:", {
    captureId,
    refundId: refund.id,
    status: refund.status,
    amountCents,
  });

  return refund;
}

/**
 * Vérifie la signature d'un webhook PayPal
 *
 * @param headers - Headers de la requête webhook
 * @param body - Corps brut de la requête
 */
export async function verifyWebhookSignature(params: {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  webhookEvent: unknown;
}): Promise<boolean> {
  const accessToken = await getAccessToken();

  const verifyPayload = {
    auth_algo: params.authAlgo,
    cert_url: params.certUrl,
    transmission_id: params.transmissionId,
    transmission_sig: params.transmissionSig,
    transmission_time: params.transmissionTime,
    webhook_id: params.webhookId || PAYPAL_WEBHOOK_ID,
    webhook_event: params.webhookEvent,
  };

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(verifyPayload),
  });

  if (!response.ok) {
    console.error("[PayPal] Webhook signature verification failed");
    return false;
  }

  const result = await response.json() as { verification_status: string };
  return result.verification_status === "SUCCESS";
}

/**
 * Extrait les headers de webhook PayPal d'une requête
 */
export function extractWebhookHeaders(headers: Headers): {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
} | null {
  const authAlgo = headers.get("paypal-auth-algo");
  const certUrl = headers.get("paypal-cert-url");
  const transmissionId = headers.get("paypal-transmission-id");
  const transmissionSig = headers.get("paypal-transmission-sig");
  const transmissionTime = headers.get("paypal-transmission-time");

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return null;
  }

  return {
    authAlgo,
    certUrl,
    transmissionId,
    transmissionSig,
    transmissionTime,
  };
}

/**
 * Récupère les détails d'une capture PayPal
 *
 * @param captureId - ID de la capture PayPal
 */
export async function getCaptureDetails(captureId: string): Promise<PayPalCapture> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${captureId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[PayPal] Failed to get capture details:", error);
    throw new Error(`PayPal get capture failed: ${response.status}`);
  }

  return await response.json() as PayPalCapture;
}

/**
 * Convertit un code devise Prisma en code PayPal
 */
export function mapCurrencyToPayPal(currency: string): string {
  // PayPal utilise les codes ISO 4217 standard
  const currencyMap: Record<string, string> = {
    EUR: "EUR",
    CAD: "CAD",
    USD: "USD",
    GBP: "GBP",
    CNY: "CNY",
  };

  return currencyMap[currency.toUpperCase()] || "EUR";
}

/**
 * Retourne l'URL du SDK PayPal pour le frontend
 */
export function getPayPalSDKUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID;
  const currency = "EUR"; // Devise par défaut

  return `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&locale=fr_FR`;
}

/**
 * Retourne le Client ID PayPal pour le frontend
 */
export function getPayPalClientId(): string {
  return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
}

/**
 * Retourne le mode PayPal (sandbox ou live)
 */
export function getPayPalMode(): "sandbox" | "live" {
  return PAYPAL_MODE as "sandbox" | "live";
}
