"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// IMPORTANT : on désactive le SSR pour le Toaster
const ToasterClient = dynamic(() => import("./toaster-client"), { ssr: false });

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ToasterClient />
    </SessionProvider>
  );
}
