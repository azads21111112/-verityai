"use client";

import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

type Claim = {
  id: number;
  title: string;
  claim_text: string;
  category: string | null;
  status: string;
  verdict: string | null;
};

type Report = {
  claim_id: number;
  claim_title: string;
  verdict: string;
  verification_score: number | null;
  supporting_evidence: number;
  contradicting_evidence: number;
  neutral_evidence: number;
  review_notes: string;
};

export default function ReportsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchClaims() {
      try {
        const response = await fetch(`${API_URL}/api/claims/`);

        if (!response.ok) {
          throw new Error("Unable to load claims.");
        }

        const data: Claim[] = await response.json();
        setClaims(data);

        if (data.length > 0) {
          setSelectedClaim(String(data[0].id));
        }
      } catch {
        setError("Unable to connect to the backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchClaims();
  }, []);

  async function generateReport() {
    if (!selectedClaim) {
      setError("Please select a claim.");
      return;
    }

    setVerifying(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch(
        `${API_URL}/api/claims/${selectedClaim}/verify`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to generate verification report.");
      }

      const data: Report = await response.json();

      setReport(data);

      const claimsResponse = await fetch(`${API_URL}/api/claims/`);

      if (claimsResponse.ok) {
        setClaims(await claimsResponse.json());
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setVerifying(false);
    }
  }

  function verdictStyle(verdict: string) {
    if (verdict === "Verified") {
      return "bg-green-100 text-green-800";
    }

    if (verdict === "False") {
      return "bg-red-100 text-red-800";
    }

    if (verdict === "Misleading") {
      return "bg-orange-100 text-orange-800";
    }

    return "bg-slate-100 text-slate-700";
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <a
            href="/reports"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </a>

          <h1 className="mt-5 text-3xl font-bold">
            Verification Reports
          </h1>

          <p className="mt-2 text-slate-600">
            Generate and review evidence-based claim verification reports.
          </p>
        </div>

        {/* Claim Selection */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-bold">
            Generate New Report
          </h2>

          <label className="mb-2 block text-sm font-semibold">
            Select a Claim
          </label>

          <select
            value={selectedClaim}
            onChange={(e) => {
              setSelectedClaim(e.target.value);
              setReport(null);
            }}
            disabled={loading || claims.length === 0}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 md:max-w-2xl"
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

          <button
            onClick={generateReport}
            disabled={verifying || !selectedClaim}
            className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {verifying ? "Generating Report..." : "Generate Report →"}
          </button>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}

        </section>

        {/* Report */}
        {report && (
          <section className="mt-8 space-y-6">

            {/* Verdict */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Verification Result
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {report.claim_title}
                  </h2>
                </div>

                <span
                  className={`rounded-full px-5 py-3 text-sm font-bold ${verdictStyle(report.verdict)}`}
                >
                  {report.verdict}
                </span>

              </div>

              <div className="mt-7 border-t border-slate-100 pt-6">

                <p className="text-sm text-slate-500">
                  Evidence Balance Score
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-bold text-blue-600">
                    {report.verification_score === null
                      ? "N/A"
                      : `${report.verification_score}%`}
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${report.verification_score ?? 0}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  This score represents the balance of supporting and
                  contradicting evidence weights. It is not a probability
                  that the claim is true.
                </p>

              </div>
            </div>

            {/* Evidence Statistics */}
            <div className="grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Supporting Evidence
                </p>

                <p className="mt-3 text-3xl font-bold text-green-600">
                  {report.supporting_evidence}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Contradicting Evidence
                </p>

                <p className="mt-3 text-3xl font-bold text-red-600">
                  {report.contradicting_evidence}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Neutral Evidence
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-700">
                  {report.neutral_evidence}
                </p>
              </div>

            </div>

            {/* Review Notes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h3 className="text-lg font-bold">
                Investigation Summary
              </h3>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                {report.review_notes}
              </p>

            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <strong>Important:</strong> This is an automated,
              rule-based prototype assessment. The verdict is not
              independently fact-checked or guaranteed to be accurate.
              Human review and reliable source verification are necessary.
            </div>

            <button
              onClick={() => window.print()}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Print Report
            </button>

          </section>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          VerityAI — Verification Reports
        </footer>

      </div>
    </main>
  );
}