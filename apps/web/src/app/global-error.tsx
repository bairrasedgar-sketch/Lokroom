"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Une erreur inattendue s&apos;est produite</h2>
          <button onClick={reset} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
