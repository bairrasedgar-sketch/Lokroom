"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  [key: string]: any;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/system-logs?filter=${filter}`);
      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and filter application system logs
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-4 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Logs</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
            <option value="http">HTTP Requests</option>
            <option value="business">Business Events</option>
          </select>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-black text-green-400 p-4 rounded-xl font-mono text-sm overflow-auto max-h-[600px]">
        {loading ? (
          <div className="text-center py-8">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No logs found</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="mb-1 hover:bg-gray-900 px-2 py-1">
              {log}
            </div>
          ))
        )}
      </div>

      <div className="text-sm text-gray-600">
        Showing last 100 lines. Logs are rotated daily and kept for 14-30 days depending on type.
      </div>
    </div>
  );
}
