"use client";

import { useEffect, useState } from "react";

type Claim = {
  id: number;
  title: string;
  claim_text: string;
  category: string | null;
  source_url: string | null;
  status: string;
  verdict: string | null;
};

const API_URL = "http://127.0.0.1:8000";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    claim_text: "",
    category: "Technology",
    source_url: "",
  });

  async function fetchClaims() {
    try {
      const response = await fetch(`${API_URL}/api/claims/`);

      if (!response.ok) {
        throw new Error("Failed to load claims");
      }

      const data = await response.json();
      setClaims(data);
    } catch {
      setMessage("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClaims();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/claims/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.detail || "Failed to submit claim"
        );
      }

      setForm({
        title: "",
        claim_text: "",
        category: "Technology",
        source_url: "",
      });

      setMessage("Claim successfully submitted!");
      await fetchClaims();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] p-5 md:p-8">

      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <a
            href="/claims"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </a>

          <h1 className="mt-5 text-3xl font-bold text-slate-800">
            Claim Investigation
          </h1>

          <p className="mt-2 text-slate-500">
            Submit suspicious claims and manage investigation records.
          </p>
        </div>

        {/* Submission Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-6 text-xl font-bold text-slate-800">
            Submit a New Claim
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Claim Title
              </label>

              <input
                required
                maxLength={250}
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="Enter claim title"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Claim Description
              </label>

              <textarea
                required
                rows={5}
                value={form.claim_text}
                onChange={(e) =>
                  setForm({ ...form, claim_text: e.target.value })
                }
                placeholder="Describe the claim you want to investigate..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option>Technology</option>
                  <option>Politics</option>
                  <option>Health</option>
                  <option>Science</option>
                  <option>Business</option>
                  <option>Education</option>
                  <option>Environment</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Source URL
                </label>

                <input
                  type="url"
                  value={form.source_url}
                  onChange={(e) =>
                    setForm({ ...form, source_url: e.target.value })
                  }
                  placeholder="https://example.com/news"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Claim →"}
            </button>

          </form>

          {message && (
            <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
              {message}
            </div>
          )}

        </section>

        {/* Claims List */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold">
              Investigation Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              All claims stored in the database.
            </p>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">
              Loading claims...
            </p>
          ) : claims.length === 0 ? (
            <p className="p-6 text-slate-500">
              No claims available.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">

              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">

                    <div className="max-w-3xl">
                      <h3 className="font-bold text-slate-800">
                        {claim.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {claim.claim_text}
                      </p>

                      <p className="mt-3 text-xs text-slate-400">
                        Claim ID: {claim.id} · Category: {claim.category || "Other"}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-2">

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {claim.status}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {claim.verdict || "Pending"}
                      </span>

                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}