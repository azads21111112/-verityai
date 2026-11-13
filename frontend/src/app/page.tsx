"use client";

import { useEffect, useState } from "react";

type Claim = {
  id: number;
  title: string;
  claim_text: string;
  category: string | null;
  status: string;
  verdict: string | null;
  created_at: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sourceCount, setSourceCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const [humanReviewed, setHumanReviewed] = useState(0);
  const [agreementRate, setAgreementRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const endpoints = ["claims", "sources", "articles", "comparison"];

        const responses = await Promise.all(
          endpoints.map((endpoint) => fetch(`${API}/api/${endpoint}/`))
        );

        if (responses.some((response) => !response.ok)) {
          throw new Error("Unable to fetch dashboard data");
        }

        const [claimsData, sourcesData, articlesData, comparisonData] =
          await Promise.all(responses.map((response) => response.json()));

        setClaims(claimsData);
        setSourceCount(sourcesData.length);
        setArticleCount(articlesData.length);
        setHumanReviewed(comparisonData.summary.human_reviewed);
        setAgreementRate(comparisonData.summary.agreement_rate);
      } catch {
        setError("Backend connection failed. Please check the API server.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const countVerdict = (verdict: string) =>
    claims.filter(
      (claim) => claim.verdict?.toLowerCase() === verdict.toLowerCase()
    ).length;

  const disagreementRate =
    agreementRate === null ? "N/A" : `${(100 - agreementRate * 100).toFixed(1)}%`;

  const stats = [
    { label: "News Articles Investigated", value: articleCount, icon: "▤", color: "blue" },
    { label: "Factual Claims Extracted", value: claims.length, icon: "◈", color: "blue" },
    { label: "Human-Reviewed Claims", value: humanReviewed, icon: "✓", color: "green" },
    { label: "False Claims", value: countVerdict("False"), icon: "✕", color: "red" },
    { label: "Misleading Claims", value: countVerdict("Misleading"), icon: "⚠", color: "orange" },
    { label: "Partially True Claims", value: countVerdict("Partially True"), icon: "◐", color: "orange" },
    { label: "Unverifiable Claims", value: countVerdict("Unverifiable"), icon: "?", color: "blue" },
    { label: "AI-Human Disagreement", value: disagreementRate, icon: "⇄", color: "red" },
    { label: "Registered Sources", value: sourceCount, icon: "◎", color: "blue" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 md:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">VerityAI</h1>
              <p className="text-xs text-slate-500">Verification Hub</p>
            </div>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="space-y-2">
            <a
              href="#dashboard"
              className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 font-semibold text-blue-700"
            >
              <span>▦</span> Dashboard
            </a>

            <a
              href="#claims"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
            >
              <span>◈</span> Claim Investigation
            </a>

            <a
              href="/evidence"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
            >
              <span>▤</span> Evidence Management
            </a>

            <a
              href="#reports"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
            >
              <span>▧</span> Verification Reports
            </a>

             <a
  href="/sources"
  className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
>
  <span>◎</span> Source Verification
</a>

            <a
              href="#bias"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
            >
              <span>⌁</span> Bias Analysis
            </a>
          </nav>

          <div className="mt-12 rounded-2xl bg-slate-900 p-4 text-white">
            <p className="text-sm font-semibold">VerityAI Workspace</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              Investigate claims, review evidence and understand information
              reliability.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">

          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 md:px-8">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                Dashboard Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Monitor claims and verification activities.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                ● System Online
              </span>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                V
              </div>
            </div>
          </header>

          <div className="space-y-8 p-5 md:p-8">

            {/* Welcome */}
            <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-7 text-white shadow-sm md:p-9">
              <p className="text-sm font-medium text-blue-100">
                AI Fake News & Verification Platform
              </p>

              <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                Welcome to VerityAI
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
                Investigate suspicious claims, evaluate supporting evidence
                and organize verification results from one workspace.
              </p>

              <a
                href="#claims"
                className="mt-6 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Explore Claims →
              </a>
            </section>

            {/* Statistics */}
            <section>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Platform Statistics</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Overview of registered claims
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">
                        {stat.label}
                      </p>

                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${
                          stat.color === "blue"
                            ? "bg-blue-50 text-blue-600"
                            : stat.color === "green"
                              ? "bg-green-50 text-green-600"
                              : stat.color === "red"
                                ? "bg-red-50 text-red-600"
                                : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {stat.icon}
                      </span>
                    </div>

                    <h3 className="mt-5 text-3xl font-bold">
                      {loading ? "..." : stat.value}
                    </h3>
                  </div>
                ))}
              </div>
            </section>

            {/* Claims Table */}
            <section
              id="claims"
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
                <div>
                  <h3 className="font-bold">Recent Claims</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Claims retrieved from the VerityAI database
                  </p>
                </div>

                <button
                  onClick={() => window.location.reload()}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50"
                >
                  ↻ Refresh
                </button>
              </div>

              {error && (
                <div className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Claim</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Verdict</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                          Loading claims...
                        </td>
                      </tr>
                    ) : claims.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                          No claims found. Add a claim to get started.
                        </td>
                      </tr>
                    ) : (
                      claims.map((claim) => (
                        <tr key={claim.id} className="hover:bg-slate-50">
                          <td className="max-w-md px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {claim.title}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {claim.claim_text}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {claim.category || "Uncategorized"}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {claim.status}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                claim.verdict === "Verified"
                                  ? "bg-green-50 text-green-700"
                                  : claim.verdict === "False"
                                    ? "bg-red-50 text-red-700"
                                    : claim.verdict
                                      ? "bg-orange-50 text-orange-700"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {claim.verdict || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
              VerityAI — AI Fake News & Verification Hub
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}