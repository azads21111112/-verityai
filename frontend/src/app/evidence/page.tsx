"use client";

import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

type Claim = {
  id: number;
  title: string;
  claim_text: string;
};

type Evidence = {
  id: number;
  claim_id: number;
  title: string;
  source_name: string;
  source_url: string;
  evidence_type: string;
  description: string | null;
  reliability_score: number | null;
};

export default function EvidencePage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [selectedClaim, setSelectedClaim] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    source_name: "",
    source_url: "",
    evidence_type: "supporting",
    description: "",
    reliability_score: "50",
  });

  useEffect(() => {
    async function loadClaims() {
      try {
        const response = await fetch(`${API_URL}/api/claims/`);

        if (!response.ok) {
          throw new Error("Unable to load claims");
        }

        const data: Claim[] = await response.json();

        setClaims(data);

        if (data.length > 0) {
          setSelectedClaim(String(data[0].id));
        }
      } catch {
        setMessage("Unable to connect to the backend.");
      } finally {
        setLoading(false);
      }
    }

    loadClaims();
  }, []);

  async function loadEvidences(claimId: string) {
    if (!claimId) {
      setEvidences([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/claims/${claimId}/evidences/`
      );

      if (!response.ok) {
        throw new Error("Unable to load evidence");
      }

      const data = await response.json();
      setEvidences(data);
    } catch {
      setMessage("Unable to load evidence records.");
    }
  }

  useEffect(() => {
    loadEvidences(selectedClaim);
  }, [selectedClaim]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedClaim) {
      setMessage("Please select a claim first.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/claims/${selectedClaim}/evidences/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            reliability_score: Number(form.reliability_score),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.detail || "Failed to submit evidence"
        );
      }

      setForm({
        title: "",
        source_name: "",
        source_url: "",
        evidence_type: "supporting",
        description: "",
        reliability_score: "50",
      });

      setMessage("Evidence successfully added!");

      await loadEvidences(selectedClaim);
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

  const typeStyle: Record<string, string> = {
    supporting: "bg-green-50 text-green-700",
    contradicting: "bg-red-50 text-red-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  const supportingCount = evidences.filter(
    (item) => item.evidence_type === "supporting"
  ).length;

  const contradictingCount = evidences.filter(
    (item) => item.evidence_type === "contradicting"
  ).length;

  const neutralCount = evidences.filter(
    (item) => item.evidence_type === "neutral"
  ).length;

  return (
   <main className="min-h-screen bg-[#f7f8fc] p-5 md:p-8 text-slate-900">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </a>

          <h1 className="mt-5 text-3xl font-bold text-slate-800">
            Evidence Management
          </h1>

          <p className="mt-2 text-slate-500">
            Collect, organize and review evidence associated with claims.
          </p>
        </div>

        {/* Claim Selection */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-semibold">
            Select Claim to Investigate
          </label>

          <select
            value={selectedClaim}
            onChange={(e) => setSelectedClaim(e.target.value)}
            disabled={loading || claims.length === 0}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 md:max-w-2xl"
          >
            {claims.length === 0 && (
              <option value="">No claims available</option>
            )}

            {claims.map((claim) => (
              <option key={claim.id} value={claim.id}>
                #{claim.id} — {claim.title}
              </option>
            ))}
          </select>

          {claims.length > 0 && selectedClaim && (
            <p className="mt-3 text-sm text-slate-500">
              {claims.find(
                (claim) => String(claim.id) === selectedClaim
              )?.claim_text}
            </p>
          )}
        </section>

        {/* Statistics */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Supporting Evidence
            </p>
            <h2 className="mt-3 text-3xl font-bold text-green-600">
              {supportingCount}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Contradicting Evidence
            </p>
            <h2 className="mt-3 text-3xl font-bold text-red-600">
              {contradictingCount}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Neutral Evidence
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-700">
              {neutralCount}
            </h2>
          </div>

        </section>

        {/* Add Evidence Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-6 text-xl font-bold">
            Add New Evidence
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Evidence Title
              </label>

              <input
                required
                maxLength={250}
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="Enter evidence title"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Source Name
                </label>

                <input
                  required
                  maxLength={250}
                  value={form.source_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      source_name: e.target.value,
                    })
                  }
                  placeholder="e.g. BBC News"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Source URL
                </label>

                <input
                  required
                  type="url"
                  value={form.source_url}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      source_url: e.target.value,
                    })
                  }
                  placeholder="https://example.com/article"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Evidence Type
                </label>

                <select
                  value={form.evidence_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      evidence_type: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="supporting">
                    Supporting Evidence
                  </option>

                  <option value="contradicting">
                    Contradicting Evidence
                  </option>

                  <option value="neutral">
                    Neutral Evidence
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Evidence Description
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
                placeholder="Explain how this evidence relates to the claim..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedClaim}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Adding Evidence..." : "Add Evidence →"}
            </button>

          </form>

          {message && (
            <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
              {message}
            </div>
          )}

        </section>

        {/* Evidence Records */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold">
              Evidence Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Evidence associated with the selected claim.
            </p>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">
              Loading...
            </p>
          ) : evidences.length === 0 ? (
            <p className="p-6 text-slate-500">
              No evidence found for this claim.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">

              {evidences.map((item) => (
                <div key={item.id} className="p-6">

                  <div className="flex flex-wrap items-start justify-between gap-3">

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Source: {item.source_name}
                      </p>

                      {item.description && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      )}

                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block break-all text-sm text-blue-600 hover:underline"
                      >
                        {item.source_url}
                      </a>
                    </div>

                    <div className="flex flex-col items-start gap-3">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          typeStyle[item.evidence_type] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.evidence_type}
                      </span>

                      <span className="text-sm font-semibold text-slate-600">
                        Reliability: {item.reliability_score ?? "N/A"}
                      </span>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

        <footer className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          VerityAI — Evidence Management
        </footer>

      </div>
    </main>
  );
}