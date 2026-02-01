"use client";

import Link from "next/link";
import { useMe } from "@/lib/useMe";

type KycWarningProps = {
  className?: string;
};

export default function KycWarning({ className = "" }: KycWarningProps) {
  const { user, loading } = useMe();

  // Ne rien afficher pendant le chargement ou si pas connecte
  if (loading || !user) {
    return null;
  }

  // Verifier le statut KYC
  const kycStatus = user.hostProfile?.kycStatus;
  const isVerified = kycStatus === "VERIFIED" || kycStatus === "verified";

  // Si verifie, ne rien afficher
  if (isVerified) {
    return null;
  }

  return (
    <div className={`rounded-xl border border-amber-200 bg-amber-50 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-800">
            Verification d&apos;identite requise
          </h4>
          <p className="mt-1 text-sm text-amber-700">
            Vous devez verifier votre identite pour pouvoir reserver ce logement.
          </p>
          <Link
            href="/account?tab=security"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-800 underline hover:text-amber-900"
          >
            Verifier mon identite
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
