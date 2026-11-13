"use client";

import { useEffect, useState } from "react";

const API_URL = "https://verityai-backend-7m7y.onrender.com";

type Source = {
  id: number;
  name: string;
  url: string;
  source_type: string | null;
  reliability_score: number | null;
  description: string | null;
  created_at: string | null;
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const [form, setForm] = useState({
    name: "",
    url: "",
    source_type: "News Media",
    reliability_score: "50",
    description: "",
  });

  async function loadSources() {
    try {
      const response = await fetch(`${API_URL}/api/sources/`);

      if (!response.ok) {
        throw new Error("Unable to load sources.");
      }

      const data = await response.json();
      setSources(data);
    } catch {
      setError(true);
      setMessage("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSources();
  }, []);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSubmitting(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(`${API_URL}/api/sources/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          reliability_score: Number(form.reliability_score),
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.detail || "Failed to register source."
        );
      }

      setForm({
        name: "",
        url: "",
        source_type: "News Media",
        reliability_score: "50",
        description: "",
      });

      setMessage("Source successfully registered!");

      await loadSources();
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </a>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Source Verification
          </h1>

          <p className="mt-2 text-slate-600">
            Register, organize and review information sources.
          </p>
        </div>

        {/* Statistics */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Registered Sources
            </p>

            <h2 className="mt-3 text-3xl font-bold text-blue-600">
              {sources.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Average Reliability Score
            </p>

            <h2 className="mt-3 text-3xl font-bold text-green-600">
              {sources.length > 0
                ? (
                    sources.reduce(
                      (total, source) =>
                        total + (source.reliability_score ?? 0),
                      0
                    ) / sources.length
                  ).toFixed(1)
                : "0"}
            </h2>
          </div>
        </section>

        {/* Add Source Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-6 text-xl font-bold text-slate-900">
            Register New Source
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Source Name
              </label>

              <input
                required
                maxLength={250}
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="e.g. BBC News"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Website URL
                </label>

                <input
                  required
                  type="url"
                  value={form.url}
                  onChange={(e) =>
                    setForm({ ...form, url: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Source Type
                </label>

                <select
                  value={form.source_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      source_type: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                >
                  <option>News Media</option>
                  <option>Government</option>
                  <option>Research Organization</option>
                  <option>Academic Journal</option>
                  <option>Fact Checking Organization</option>
                  <option>Social Media</option>
                  <option>Other</option>
                </select>
              </div>

            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Reliability Score (0–100)
              </label>

              <input
                required
                type="number"
                min="0"
                max="100"
                value={form.reliability_score}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reliability_score: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 md:max-w-md"
              />

              <p className="mt-2 text-xs text-slate-500">
                This is a manually assigned assessment, not an automatically verified rating.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Source Description
              </label>

              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this source..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Registering..."
                : "Register Source →"}
            </button>

          </form>

          {message && (
            <div
              className={`mt-5 rounded-xl p-4 text-sm ${
                error
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

        </section>

        {/* Registered Sources */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Registered Sources
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Sources retrieved from the VerityAI database.
              </p>
            </div>

            <button
              onClick={loadSources}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">
              Loading sources...
            </p>
          ) : sources.length === 0 ? (
            <p className="p-6 text-slate-500">
              No registered sources found.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">

              {sources.map((source) => (
                <div
                  key={source.id}
                  className="p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div className="min-w-0 flex-1">

                      <h3 className="font-bold text-slate-900">
                        {source.name}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {source.source_type || "Uncategorized"}
                      </p>

                      {source.description && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {source.description}
                        </p>
                      )}

                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block break-all text-sm text-blue-600 hover:underline"
                      >
                        {source.url}
                      </a>

                      <p className="mt-3 text-xs text-slate-400">
                        Source ID: {source.id}
                      </p>

                    </div>

                    <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">
                      <p className="text-xs font-medium text-slate-600">
                        Reliability
                      </p>

                      <p className="mt-1 text-xl font-bold text-blue-700">
                        {source.reliability_score ?? "N/A"}
                        {source.reliability_score !== null ? "%" : ""}
                      </p>
                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </section>

        <footer className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          VerityAI — Source Verification
        </footer>

      </div>
    </main>
  );
}