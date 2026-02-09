"use client";

import { useState } from "react";

export default function SentryTestPage() {
  const [apiError, setApiError] = useState<string | null>(null);

  const triggerClientError = () => {
    throw new Error("Test error from client component");
  };

  const triggerAPIError = async () => {
    try {
      const response = await fetch("/api/sentry-test");
      const data = await response.json();
      setApiError(data.error || "API error triggered");
    } catch (error) {
      setApiError((error as Error).message);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Sentry Error Monitoring Test</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Errors will only be sent to Sentry in production mode.
          In development, they will be logged to the console.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">1. Client-Side Error</h2>
          <p className="text-gray-600 mb-4">
            This will trigger an error in the React component and be caught by the Error Boundary.
          </p>
          <button
            onClick={triggerClientError}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Trigger Client Error
          </button>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">2. API Error</h2>
          <p className="text-gray-600 mb-4">
            This will trigger an error in an API route and be caught by the API wrapper.
          </p>
          <button
            onClick={triggerAPIError}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Trigger API Error
          </button>
          {apiError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {apiError}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">3. Manual Error Capture</h2>
          <p className="text-gray-600 mb-4">
            This will manually capture an error using Sentry utilities.
          </p>
          <button
            onClick={() => {
              import("@/lib/sentry/utils").then(({ captureException }) => {
                captureException(new Error("Manual error capture test"), {
                  testType: "manual",
                  timestamp: new Date().toISOString(),
                });
                alert("Error captured manually (check Sentry dashboard)");
              });
            }}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Capture Error Manually
          </button>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">4. Breadcrumb Test</h2>
          <p className="text-gray-600 mb-4">
            This will add breadcrumbs and then trigger an error to see the trail.
          </p>
          <button
            onClick={() => {
              import("@/lib/sentry/utils").then(
                ({ addBreadcrumb, captureException }) => {
                  addBreadcrumb("User clicked test button", "user-action");
                  addBreadcrumb("Loading test data", "navigation");
                  addBreadcrumb("Test data loaded", "http");

                  setTimeout(() => {
                    captureException(new Error("Error with breadcrumbs"), {
                      testType: "breadcrumbs",
                    });
                    alert("Error with breadcrumbs captured");
                  }, 100);
                }
              );
            }}
            className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Test Breadcrumbs
          </button>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to Test:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Make sure you have set <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_SENTRY_DSN</code> in your .env file</li>
          <li>Build the app in production mode: <code className="bg-gray-200 px-1 rounded">npm run build</code></li>
          <li>Start the production server: <code className="bg-gray-200 px-1 rounded">npm start</code></li>
          <li>Visit this page and click the buttons above</li>
          <li>Check your Sentry dashboard at <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sentry.io</a></li>
        </ol>
      </div>
    </div>
  );
}
