"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type AIReport = {
  analysis_id: number;
  tool_name: string;
  model_version?: string | null;
  article_id: number;
  article_title?: string | null;
  publisher?: string | null;
  article_url?: string | null;
  analysis_text?: string | null;
  source_suggestions?: unknown;
  limitations?: string | null;
  ai_verdict?: string | null;
  comparison_status: string;
};

type Comparison = {
  claim_id: number;
  claim_title?: string | null;
  claim_text: string;
  category?: string | null;
  human_status?: string | null;
  human_verdict?: string | null;
  human_review_notes?: string | null;
  human_reviewed: boolean;
  ai_reports_count: number;
  ai_reports: AIReport[];
  comparison_status: string;
};

type Summary = {
  total_claims: number;
  human_reviewed: number;
  pending_human_review: number;
  claims_with_ai_analysis: number;
  claims_without_ai_analysis: number;
  comparable_claims: number;
  agreement_rate: number | null;
};

type APIResponse = {
  summary: Summary;
  comparisons: Comparison[];
};

type Filter =
  | "all"
  | "ai"
  | "reviewed"
  | "pending"
  | "not_comparable";

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function StatusBadge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "green" | "blue" | "yellow" | "red" | "gray";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[color]}`}
    >
      {children}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-gray-900">
            {value}
          </h3>
          <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ComparisonPage() {
  const [data, setData] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadComparison(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await fetch(`${API_URL}/api/comparison/`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Comparison API failed (${response.status}). Check backend deployment.`
        );
      }

      const result: APIResponse = await response.json();

      if (!result || !result.summary || !Array.isArray(result.comparisons)) {
        throw new Error("Invalid response received from comparison API.");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load comparison data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadComparison();
  }, []);

  const filteredComparisons = useMemo(() => {
    if (!data) return [];

    const query = search.toLowerCase().trim();

    return data.comparisons.filter((item) => {
      const matchesSearch =
        !query ||
        String(item.claim_id).includes(query) ||
        (item.claim_title || "").toLowerCase().includes(query) ||
        (item.claim_text || "").toLowerCase().includes(query) ||
        item.ai_reports.some((report) =>
          (report.tool_name || "").toLowerCase().includes(query)
        );

      let matchesFilter = true;

      switch (filter) {
        case "ai":
          matchesFilter = item.ai_reports_count > 0;
          break;
        case "reviewed":
          matchesFilter = item.human_reviewed;
          break;
        case "pending":
          matchesFilter = !item.human_reviewed;
          break;
        case "not_comparable":
          matchesFilter =
            item.comparison_status !== "comparable" ||
            item.ai_reports.every((report) => !report.ai_verdict);
          break;
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });
  }, [data, search, filter]);

  const summary = data?.summary;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <span>VerityAI</span>
              <span className="text-gray-400">/</span>
              <span>Comparison</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              AI vs Human Comparison
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Compare AI-generated analysis with human fact-checking decisions
              and inspect the evidence behind each review.
            </p>
          </div>

          <button
            onClick={() => loadComparison(true)}
            disabled={loading || refreshing}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh Data"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">
              Unable to load comparison data
            </p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              onClick={() => loadComparison()}
              className="mt-3 text-sm font-semibold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border bg-white p-16 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="font-medium text-gray-700">
              Loading comparison data...
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Connecting to VerityAI backend
            </p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Summary Cards */}
            <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <SummaryCard
                title="Total Claims"
                value={summary?.total_claims ?? 0}
                subtitle="Claims in the system"
                icon="▤"
                color="bg-blue-50 text-blue-600"
              />

              <SummaryCard
                title="AI Analysed"
                value={summary?.claims_with_ai_analysis ?? 0}
                subtitle="Claims with linked AI reports"
                icon="✧"
                color="bg-purple-50 text-purple-600"
              />

              <SummaryCard
                title="Human Reviewed"
                value={summary?.human_reviewed ?? 0}
                subtitle="Completed human reviews"
                icon="✓"
                color="bg-green-50 text-green-600"
              />

              <SummaryCard
                title="Pending Review"
                value={summary?.pending_human_review ?? 0}
                subtitle="Awaiting human verification"
                icon="◷"
                color="bg-amber-50 text-amber-600"
              />

              <SummaryCard
                title="Comparable Claims"
                value={summary?.comparable_claims ?? 0}
                subtitle="Both verdicts available"
                icon="⇄"
                color="bg-gray-100 text-gray-600"
              />
            </section>

            {/* Comparison information */}
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <span className="text-xl">ℹ️</span>
                <div>
                  <h3 className="font-semibold text-blue-900">
                    About comparison results
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    AI analysis reports are available, but the current backend
                    does not provide a structured AI verdict. Therefore, AI
                    verdicts, agreement status and agreement rate are shown as
                    Not Available until structured AI verdict data exists.
                    Human verdicts are displayed independently.
                  </p>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Claim Comparison
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Showing {filteredComparisons.length} of{" "}
                    {data.comparisons.length} claims
                  </p>
                </div>

                <div className="w-full lg:max-w-sm">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search claim, ID or AI tool..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All Claims"],
                    ["ai", "AI Analysed"],
                    ["reviewed", "Human Reviewed"],
                    ["pending", "Pending Review"],
                    ["not_comparable", "Not Comparable"],
                  ] as [Filter, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      filter === key
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Table */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse text-left">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-5 py-4">Claim</th>
                      <th className="px-5 py-4">AI Tool</th>
                      <th className="px-5 py-4">AI Verdict</th>
                      <th className="px-5 py-4">Human Verdict</th>
                      <th className="px-5 py-4">Agreement</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredComparisons.map((item) => {
                      const expanded = expandedId === item.claim_id;
                      const firstReport = item.ai_reports[0];

                      return (
                        <ComparisonRows
                          key={item.claim_id}
                          item={item}
                          expanded={expanded}
                          firstReport={firstReport}
                          onToggle={() =>
                            setExpandedId(
                              expanded ? null : item.claim_id
                            )
                          }
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredComparisons.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <div className="text-4xl text-gray-300">⌕</div>
                  <h3 className="mt-3 font-semibold text-gray-700">
                    No claims found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try changing your search or filter.
                  </p>
                </div>
              )}
            </section>

            {/* Footer information */}
            <div className="mt-5 flex flex-col justify-between gap-2 text-xs text-gray-400 sm:flex-row">
              <p>
                VerityAI AI vs Human Comparison Dashboard
              </p>
              <p>
                Agreement Rate:{" "}
                {summary?.agreement_rate == null
                  ? "N/A"
                  : `${summary.agreement_rate}%`}
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ComparisonRows({
  item,
  expanded,
  firstReport,
  onToggle,
}: {
  item: Comparison;
  expanded: boolean;
  firstReport?: AIReport;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="transition hover:bg-blue-50/40">
        <td className="max-w-xs px-5 py-5">
          <p className="text-xs font-semibold text-blue-600">
            CLAIM #{item.claim_id}
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900">
            {item.claim_title || item.claim_text}
          </p>
          {item.category && (
            <p className="mt-2 text-xs text-gray-400">
              {item.category}
            </p>
          )}
        </td>

        <td className="px-5 py-5">
          {item.ai_reports_count > 0 ? (
            <div>
              {item.ai_reports.map((report) => (
                <div
                  key={report.analysis_id}
                  className="mb-1 text-sm font-medium text-purple-700"
                >
                  {report.tool_name || "Unknown tool"}
                </div>
              ))}
              <p className="text-xs text-gray-400">
                {item.ai_reports_count} report(s)
              </p>
            </div>
          ) : (
            <StatusBadge color="gray">No AI Analysis</StatusBadge>
          )}
        </td>

        <td className="px-5 py-5">
          <StatusBadge color="yellow">Not Available</StatusBadge>
        </td>

        <td className="px-5 py-5">
          {item.human_reviewed && item.human_verdict ? (
            <StatusBadge color="green">
              {item.human_verdict}
            </StatusBadge>
          ) : (
            <StatusBadge color="yellow">Pending</StatusBadge>
          )}
        </td>

        <td className="px-5 py-5">
          <StatusBadge color="gray">Not Comparable</StatusBadge>
        </td>

        <td className="px-5 py-5">
          {item.human_reviewed ? (
            <StatusBadge color="green">Human Reviewed</StatusBadge>
          ) : item.ai_reports_count > 0 ? (
            <StatusBadge color="blue">AI Analysed</StatusBadge>
          ) : (
            <StatusBadge color="yellow">Pending</StatusBadge>
          )}
        </td>

        <td className="px-5 py-5">
          <button
            onClick={onToggle}
            className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            {expanded ? "Hide Details ↑" : "View Details ↓"}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-5 py-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Claim Details */}
              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-bold text-gray-900">
                  Claim Information
                </h3>
                <p className="mt-3 text-xs font-semibold uppercase text-gray-400">
                  Claim Text
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-700">
                  {item.claim_text}
                </p>

                <div className="mt-5 border-t pt-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Human Verdict
                  </p>
                  <div className="mt-2">
                    {item.human_verdict ? (
                      <StatusBadge color="green">
                        {item.human_verdict}
                      </StatusBadge>
                    ) : (
                      <StatusBadge color="yellow">
                        Not Reviewed
                      </StatusBadge>
                    )}
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase text-gray-400">
                    Human Investigation Notes
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {item.human_review_notes || "No review notes available."}
                  </p>
                </div>
              </div>

              {/* AI Details */}
              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-bold text-gray-900">
                  AI Analysis Reports
                </h3>

                {item.ai_reports.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">
                    No AI analysis has been linked to this claim.
                  </p>
                ) : (
                  <div className="mt-4 space-y-5">
                    {item.ai_reports.map((report) => (
                      <div
                        key={report.analysis_id}
                        className="rounded-xl border border-purple-100 bg-purple-50/40 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-semibold text-purple-800">
                            {report.tool_name}
                          </h4>
                          <StatusBadge color="yellow">
                            AI Verdict: Not Available
                          </StatusBadge>
                        </div>

                        {report.model_version && (
                          <p className="mt-1 text-xs text-gray-500">
                            Model: {report.model_version}
                          </p>
                        )}

                        <p className="mt-4 text-xs font-semibold uppercase text-gray-400">
                          Analysis Summary
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {report.analysis_text ||
                            "No analysis text available."}
                        </p>

                        <p className="mt-4 text-xs font-semibold uppercase text-gray-400">
                          Suggested Sources
                        </p>
                        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs leading-5 text-gray-600">
                          {formatValue(report.source_suggestions)}
                        </pre>

                        <p className="mt-4 text-xs font-semibold uppercase text-gray-400">
                          AI Limitations
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {report.limitations || "Not specified."}
                        </p>

                        <div className="mt-4 border-t border-purple-100 pt-3">
                          <p className="text-xs text-gray-500">
                            Article: {report.article_title || "Not available"}
                          </p>
                          {report.publisher && (
                            <p className="mt-1 text-xs text-gray-500">
                              Publisher: {report.publisher}
                            </p>
                          )}
                          {report.article_url && (
                            <a
                              href={report.article_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
                            >
                              Open Original Article ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Comparison Result: Not Comparable
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-700">
                A structured AI verdict is required before agreement or
                disagreement can be calculated for this claim.
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
