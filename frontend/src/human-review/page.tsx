"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://verityai-backend-7m7y.onrender.com";

type Claim = {
  id: number;
  title: string;
  claim_text: string;
  category: string | null;
  source_url: string | null;
  status: string;
  verdict: string | null;
  review_notes: string | null;
};

type Evidence = {
  id: number;
  claim_id: number;
  title: string;
  source_name: string;
  source_url: string;
  source_type: string | null;
  evidence_type: string;
  excerpt: string | null;
  description: string | null;
  reliability_score: number | null;
  published_at: string | null;
  accessed_at: string | null;
};

const verdicts = [
  "Verified",
  "False",
  "Misleading",
  "Partially True",
  "Unverifiable",
];

export default function HumanReviewPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selected, setSelected] = useState<Claim | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);

  const [verdict, setVerdict] = useState("Verified");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadClaims() {
    try {
      const response = await fetch(`${API_URL}/api/claims/`);

      if (!response.ok) {
        throw new Error("Could not load claims.");
      }

      const data: Claim[] = await response.json();
      setClaims(data);
    } catch {
      setMessage("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function selectClaim(claim: Claim) {
    setSelected(claim);
    setEvidences([]);
    setMessage("");
    setEvidenceLoading(true);

    setVerdict(claim.verdict || "Verified");
    setNotes(claim.review_notes || "");

    try {
      const response = await fetch(
        `${API_URL}/api/claims/${claim.id}/evidences/`
      );

      if (!response.ok) {
        throw new Error("Could not load evidence.");
      }

      const data: Evidence[] = await response.json();
      setEvidences(data);
    } catch {
      setMessage("Unable to load evidence for this claim.");
    } finally {
      setEvidenceLoading(false);
    }
  }

  async function submitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selected) return;

    if (notes.trim().length < 10) {
      setMessage("Please provide at least 10 characters of review notes.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/claims/${selected.id}/human-review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verdict,
            review_notes: notes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Review submission failed.");
      }

      setMessage("Human verification saved successfully!");

      await loadClaims();

      const updatedClaim = await fetch(
        `${API_URL}/api/claims/${selected.id}`
      );

      if (updatedClaim.ok) {
        const updatedData: Claim = await updatedClaim.json();
        setSelected(updatedData);
      }
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

  useEffect(() => {
    void loadClaims();
  }, []);

  const reviewedCount = claims.filter(
    (claim) => claim.status === "human_reviewed"
  ).length;

  const pendingCount = claims.length - reviewedCount;

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <a
            href="/"
            className="text-sm font-semibold text-blue-600"
          >
            ← Back to Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Human Fact-Checking
          </h1>

          <p className="mt-2 text-slate-500">
            Independently review claims using credible evidence
            and record the final human verdict.
          </p>
        </div>

        {/* STATISTICS */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Claims</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {claims.length}
            </h2>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Human Reviewed</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {reviewedCount}
            </h2>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending Review</p>
            <h2 className="mt-2 text-3xl font-bold text-orange-500">
              {pendingCount}
            </h2>
          </div>

        </div>

        {message && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* CLAIM LIST */}
          <section className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-2">

            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Claims to Review
            </h2>

            {loading ? (
              <p className="text-slate-500">Loading claims...</p>
            ) : claims.length === 0 ? (
              <p className="text-slate-500">No claims available.</p>
            ) : (
              <div className="space-y-3">

                {claims.map((claim) => (
                  <button
                    key={claim.id}
                    onClick={() => selectClaim(claim)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      selected?.id === claim.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">

                      <span className="text-xs font-semibold text-slate-400">
                        CLAIM #{claim.id}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          claim.status === "human_reviewed"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {claim.status === "human_reviewed"
                          ? "Reviewed"
                          : "Pending"}
                      </span>

                    </div>

                    <h3 className="mt-2 font-semibold text-slate-800">
                      {claim.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                      {claim.claim_text}
                    </p>

                    {claim.verdict && (
                      <p className="mt-2 text-xs font-bold text-blue-700">
                        Verdict: {claim.verdict}
                      </p>
                    )}

                  </button>
                ))}

              </div>
            )}

          </section>

          {/* REVIEW PANEL */}
          <section className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-3">

            {!selected ? (
              <div className="flex min-h-96 items-center justify-center text-center">
                <div>
                  <div className="text-5xl">🔍</div>
                  <h2 className="mt-4 text-xl font-bold text-slate-700">
                    Select a Claim
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Select a claim from the left panel to inspect
                    evidence and complete human verification.
                  </p>
                </div>
              </div>
            ) : (

              <div>

                <div className="mb-5 border-b pb-4">
                  <p className="text-xs font-semibold text-blue-600">
                    CLAIM #{selected.id}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {selected.title}
                  </h2>

                  <p className="mt-3 leading-7 text-slate-600">
                    {selected.claim_text}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    Category: {selected.category || "Uncategorized"}
                  </p>
                </div>

                {/* EVIDENCE */}
                <div className="mb-7">

                  <h3 className="mb-4 text-lg font-bold text-slate-900">
                    Supporting Evidence Repository
                  </h3>

                  {evidenceLoading ? (
                    <p className="text-slate-500">
                      Loading evidence...
                    </p>
                  ) : evidences.length === 0 ? (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
                      No evidence available. Add evidence before
                      submitting a human verdict.
                    </div>
                  ) : (

                    <div className="space-y-4">

                      {evidences.map((evidence) => (
                        <div
                          key={evidence.id}
                          className="rounded-lg border border-slate-200 p-4"
                        >

                          <div className="flex flex-wrap items-center justify-between gap-2">

                            <h4 className="font-semibold text-slate-800">
                              {evidence.title}
                            </h4>

                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              evidence.evidence_type?.toLowerCase() === "supporting"
                                ? "bg-green-100 text-green-700"
                                : evidence.evidence_type?.toLowerCase() === "contradicting"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {evidence.evidence_type}
                            </span>

                          </div>

                          <p className="mt-2 text-sm text-slate-600">
                            Publisher: {evidence.source_name}
                          </p>

                          {evidence.source_type && (
                            <p className="mt-1 text-xs text-slate-500">
                              Source type: {evidence.source_type}
                            </p>
                          )}

                          {evidence.excerpt && (
                            <blockquote className="mt-3 rounded bg-slate-50 p-3 text-sm italic text-slate-600">
                              "{evidence.excerpt}"
                            </blockquote>
                          )}

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

                            <span className="text-xs text-slate-500">
                              Reliability score: {
                                evidence.reliability_score ?? "Not rated"
                              }
                            </span>

                            <a
                              href={evidence.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-blue-600 hover:underline"
                            >
                              Open Original Source ↗
                            </a>

                          </div>

                        </div>
                      ))}

                    </div>
                  )}

                </div>

                {/* HUMAN VERDICT FORM */}
                <form onSubmit={submitReview}>

                  <div className="border-t pt-5">

                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                      Final Human Verdict
                    </h3>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Select Verdict
                    </label>

                    <select
                      value={verdict}
                      onChange={(e) => setVerdict(e.target.value)}
                      className="mb-5 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-800 outline-none focus:border-blue-500"
                    >
                      {verdicts.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Investigation Notes
                    </label>

                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={5}
                      required
                      minLength={10}
                      placeholder="Explain why this verdict was selected. Mention the evidence, source reliability, supporting or contradicting information, and limitations."
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Minimum 10 characters. Human reviewer must
                      independently assess the evidence.
                    </p>

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        evidenceLoading ||
                        evidences.length === 0
                      }
                      className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {submitting
                        ? "Saving Review..."
                        : "Submit Human Verification"}
                    </button>

                  </div>

                </form>

              </div>
            )}

          </section>

        </div>

      </div>
    </main>
  );
}