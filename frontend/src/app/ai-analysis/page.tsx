"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type Article = {
  id: number;
  title: string;
  publisher: string;
};

type Analysis = {
  id: number;
  article_id: number;
  tool_name: string;
  model_version: string | null;
  analysis_text: string;
  claims_extracted: number;
  source_suggestions: string | null;
  limitations: string | null;
  analysis_date: string | null;
  created_at: string;
};

type CandidateClaim = {
  id: number;
  claim_text: string;
  selected: boolean;
};


type FormData = {
  article_id: string;
  tool_name: string;
  model_version: string;
  analysis_text: string;
  claims_extracted: string;
  source_suggestions: string;
  limitations: string;
  analysis_date: string;
};

const emptyForm: FormData = {
  article_id: "",
  tool_name: "ChatGPT",
  model_version: "",
  analysis_text: "",
  claims_extracted: "0",
  source_suggestions: "",
  limitations: "",
  analysis_date: "",
};

const toolStyles: Record<string, string> = {
  ChatGPT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Gemini: "bg-blue-50 text-blue-700 border-blue-200",
  Claude: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function AIAnalysisPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  const [form, setForm] = useState<FormData>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedTool, setSelectedTool] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState("All");

  const [selectedAnalysis, setSelectedAnalysis] =
    useState<Analysis | null>(null);
    const [candidateClaims, setCandidateClaims] =
  useState<CandidateClaim[]>([]);

const [extractingFrom, setExtractingFrom] =
  useState<Analysis | null>(null);

const [bulkSaving, setBulkSaving] = useState(false);

  // LOAD ARTICLES AND ANALYSES
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [articleResponse, analysisResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/articles/`),
          fetch(`${API_URL}/api/ai-analyses/`),
        ]);

      if (!articleResponse.ok) {
        throw new Error("Could not load articles.");
      }

      if (!analysisResponse.ok) {
        throw new Error("Could not load AI analyses.");
      }

      const articleData = await articleResponse.json();
      const analysisData = await analysisResponse.json();

      setArticles(articleData);
      setAnalyses(analysisData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // FORM FIELD UPDATE
  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // FILTER ANALYSES
  const filteredAnalyses = useMemo(() => {
    return analyses.filter((item) => {
      const matchesTool =
        selectedTool === "All" ||
        item.tool_name === selectedTool;

      const matchesArticle =
        selectedArticle === "All" ||
        item.article_id.toString() === selectedArticle;

      return matchesTool && matchesArticle;
    });
  }, [analyses, selectedTool, selectedArticle]);

  // STATISTICS
  const totalClaims = analyses.reduce(
    (total, item) => total + item.claims_extracted,
    0
  );

  const chatGPTCount = analyses.filter(
    (item) => item.tool_name === "ChatGPT"
  ).length;

  const geminiCount = analyses.filter(
    (item) => item.tool_name === "Gemini"
  ).length;

  const claudeCount = analyses.filter(
    (item) => item.tool_name === "Claude"
  ).length;

  // CREATE ANALYSIS
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        article_id: Number(form.article_id),
        tool_name: form.tool_name,
        model_version: form.model_version.trim() || null,
        analysis_text: form.analysis_text.trim(),
        claims_extracted: Number(form.claims_extracted),
        source_suggestions:
          form.source_suggestions.trim() || null,
        limitations: form.limitations.trim() || null,
        analysis_date: form.analysis_date
          ? new Date(form.analysis_date).toISOString()
          : null,
      };

      const response = await fetch(
        `${API_URL}/api/ai-analyses/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Could not save analysis."
        );
      }

      setForm(emptyForm);
      setMessage("AI analysis saved successfully.");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save analysis."
      );
    } finally {
      setSaving(false);
    }
  }

  // DELETE ANALYSIS
  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this analysis?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/ai-analyses/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Could not delete analysis.");
      }

      setAnalyses((previous) =>
        previous.filter((item) => item.id !== id)
      );

      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }

      setMessage("Analysis deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Delete failed."
      );
    } finally {
      setDeletingId(null);
    }


  }

// ======================================
// CLAIM EXTRACTION FUNCTIONS
// ======================================

// 1. Extract numbered and bulleted candidates
function extractCandidateClaims(analysis: Analysis) {
  setError("");
  setMessage("");

  const lines = analysis.analysis_text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const extracted: CandidateClaim[] = [];

  for (const line of lines) {
    const match = line.match(
      /^(?:(?:\d+[\.\):])|[-*•])\s+(.+)$/
    );

    if (!match) continue;

    const claimText = match[1]
      .replace(/\s+/g, " ")
      .trim();

    if (claimText.length < 25) continue;

    extracted.push({
      id: extracted.length + 1,
      claim_text: claimText,
      selected: true,
    });
  }

  setExtractingFrom(analysis);

  if (extracted.length === 0) {
    setCandidateClaims([]);

    setMessage(
      "No numbered or bulleted candidates found in this report."
    );

    return;
  }

  setCandidateClaims(extracted);
  setSelectedAnalysis(null);

  setMessage(
    `${extracted.length} candidate claims extracted. Please review them.`
  );
}

// 2. Edit candidate claim
function updateCandidateClaim(
  id: number,
  value: string
) {
  setCandidateClaims((previous) =>
    previous.map((item) =>
      item.id === id
        ? { ...item, claim_text: value }
        : item
    )
  );
}

// 3. Select or deselect candidate
function toggleCandidateClaim(id: number) {
  setCandidateClaims((previous) =>
    previous.map((item) =>
      item.id === id
        ? { ...item, selected: !item.selected }
        : item
    )
  );
}

// 4. Remove candidate
function removeCandidateClaim(id: number) {
  setCandidateClaims((previous) =>
    previous.filter((item) => item.id !== id)
  );
}

// 5. Bulk save selected claims
async function saveCandidateClaims() {
  if (!extractingFrom) return;

  const selectedClaims = candidateClaims.filter(
    (item) =>
      item.selected &&
      item.claim_text.trim().length >= 25
  );

  if (selectedClaims.length === 0) {
    setError("Please select at least one valid claim.");
    return;
  }

  setBulkSaving(true);
  setError("");
  setMessage("");

  try {
    const payload = {
      claims: selectedClaims.map((item) => ({
        title:
          item.claim_text.trim().length > 100
            ? item.claim_text.trim().slice(0, 97) + "..."
            : item.claim_text.trim(),

        claim_text: item.claim_text.trim(),

        category: "Needs review",

        source_url: null,
      })),
    };

    const response = await fetch(
      `${API_URL}/api/claims/bulk`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail || "Could not save claims."
      );
    }



    // LINK NEWLY CREATED CLAIMS TO THEIR AI ANALYSIS

const createdClaims = result.created_claims || [];

const linkResults = await Promise.allSettled(
  createdClaims.map((claim: { id: number }) =>
    fetch(`${API_URL}/api/claim-analysis-links/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        claim_id: claim.id,
        analysis_id: extractingFrom.id,
      }),
    })
  )
);

const failedLinks = linkResults.filter(
  (item) => item.status === "rejected"
).length;

const unsuccessfulResponses = linkResults.filter(
  (item) =>
    item.status === "fulfilled" &&
    !item.value.ok
).length;

const totalLinkFailures =
  failedLinks + unsuccessfulResponses;

    setMessage(
  `Import completed: ${result.created_count} claims created, ${result.duplicate_count} duplicates skipped, ${totalLinkFailures} provenance links failed.`
);

    setCandidateClaims([]);
    setExtractingFrom(null);

  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Bulk import failed."
    );
  } finally {
    setBulkSaving(false);
  }
}


  // ARTICLE TITLE
  function getArticleTitle(articleId: number) {
    return (
      articles.find((item) => item.id === articleId)?.title ||
      `Article #${articleId}`
    );
  }

  function formatDate(date: string | null) {
    if (!date) return "Not specified";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Invalid date";
    }

    return parsed.toLocaleString();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
              WEEK 6 · STEP 02
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              AI-Assisted News Analysis
            </h1>

            <p className="mt-2 text-slate-600">
              Manage and compare AI-generated news analysis reports.
            </p>
          </div>

          <div className="rounded-xl border bg-white px-6 py-4 shadow-sm">
            <p className="text-3xl font-bold">
              {analyses.length}
            </p>

            <p className="text-sm text-slate-500">
              Total Analyses
            </p>
          </div>

        </header>

        {/* NOTIFICATIONS */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* STATISTICS */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total AI Analyses"
            value={analyses.length}
            subtitle="All saved reports"
          />

          <StatCard
            title="ChatGPT"
            value={chatGPTCount}
            subtitle="Analysis reports"
          />

          <StatCard
            title="Gemini"
            value={geminiCount}
            subtitle="Analysis reports"
          />

          <StatCard
            title="Claude"
            value={claudeCount}
            subtitle="Analysis reports"
          />

        </section>

        {/* CLAIM STATISTICS */}

        <section className="mb-8 rounded-xl border bg-white p-5 shadow-sm">

          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">

            <div>
              <h2 className="text-lg font-bold">
                Extracted Claims Overview
              </h2>

              <p className="text-sm text-slate-500">
                Total claims reported by saved AI analyses.
              </p>
            </div>

            <p className="text-3xl font-bold text-blue-700">
              {totalClaims}
            </p>

          </div>

        </section>

        {/* ADD ANALYSIS FORM */}

        <section className="mb-10 rounded-2xl border bg-white p-5 shadow-sm md:p-7">

          <div className="mb-6">
            <h2 className="text-xl font-bold">
              Add AI Analysis
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Store the actual analysis generated by ChatGPT, Gemini or Claude.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-2"
          >

            {/* ARTICLE */}

            <FormField label="Select News Article *">

              <select
                required
                value={form.article_id}
                onChange={(e) =>
                  updateField("article_id", e.target.value)
                }
                className="form-input"
              >
                <option value="">
                  Select an article
                </option>

                {articles.map((article) => (
                  <option
                    key={article.id}
                    value={article.id}
                  >
                    {article.title}
                  </option>
                ))}

              </select>

            </FormField>

            {/* AI TOOL */}

            <FormField label="AI Tool *">

              <select
                value={form.tool_name}
                onChange={(e) =>
                  updateField("tool_name", e.target.value)
                }
                className="form-input"
              >
                <option value="ChatGPT">ChatGPT</option>
                <option value="Gemini">Google Gemini</option>
                <option value="Claude">Claude</option>
              </select>

            </FormField>

            {/* MODEL */}

            <FormField label="Model Version">

              <input
                type="text"
                value={form.model_version}
                onChange={(e) =>
                  updateField("model_version", e.target.value)
                }
                placeholder="e.g. GPT-6, Gemini model version"
                className="form-input"
              />

            </FormField>

            {/* DATE */}

            <FormField label="Analysis Date">

              <input
                type="datetime-local"
                value={form.analysis_date}
                onChange={(e) =>
                  updateField("analysis_date", e.target.value)
                }
                className="form-input"
              />

            </FormField>

            {/* CLAIM COUNT */}

            <FormField label="Extracted Claims Count">

              <input
                type="number"
                min="0"
                value={form.claims_extracted}
                onChange={(e) =>
                  updateField("claims_extracted", e.target.value)
                }
                className="form-input"
              />

            </FormField>

            {/* FULL ANALYSIS */}

            <div className="md:col-span-2">

              <FormField label="Complete AI Analysis *">

                <textarea
                  required
                  minLength={10}
                  rows={9}
                  value={form.analysis_text}
                  onChange={(e) =>
                    updateField("analysis_text", e.target.value)
                  }
                  placeholder="Paste the complete AI-generated analysis report here..."
                  className="form-input resize-y"
                />

              </FormField>

            </div>

            {/* SOURCES */}

            <div className="md:col-span-2">

              <FormField label="AI Suggested Sources">

                <textarea
                  rows={4}
                  value={form.source_suggestions}
                  onChange={(e) =>
                    updateField("source_suggestions", e.target.value)
                  }
                  placeholder="Enter sources suggested by the AI, including URLs where available..."
                  className="form-input resize-y"
                />

              </FormField>

            </div>

            {/* LIMITATIONS */}

            <div className="md:col-span-2">

              <FormField label="AI Limitations and Concerns">

                <textarea
                  rows={4}
                  value={form.limitations}
                  onChange={(e) =>
                    updateField("limitations", e.target.value)
                  }
                  placeholder="Record hallucinations, missing citations, unsupported claims, lack of browsing, or other limitations..."
                  className="form-input resize-y"
                />

              </FormField>

            </div>

            {/* SUBMIT */}

            <div className="md:col-span-2">

              <button
                type="submit"
                disabled={saving || articles.length === 0}
                className="rounded-lg bg-blue-700 px-7 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving Analysis..." : "+ Save AI Analysis"}
              </button>

              {articles.length === 0 && (
                <p className="mt-2 text-sm text-red-600">
                  No articles available. Add an article first.
                </p>
              )}

            </div>

          </form>

        </section>

        {/* SAVED ANALYSES */}

        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>
              <h2 className="text-xl font-bold">
                Saved AI Analysis Reports
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View and manage previously saved reports.
              </p>
            </div>

            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              ↻ Refresh
            </button>

          </div>

          {/* FILTERS */}

          <div className="mb-6 grid gap-4 md:grid-cols-2">

            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="form-input"
            >
              <option value="All">All AI Tools</option>
              <option value="ChatGPT">ChatGPT</option>
              <option value="Gemini">Gemini</option>
              <option value="Claude">Claude</option>
            </select>

            <select
              value={selectedArticle}
              onChange={(e) => setSelectedArticle(e.target.value)}
              className="form-input"
            >
              <option value="All">All Articles</option>

              {articles.map((article) => (
                <option
                  key={article.id}
                  value={article.id}
                >
                  {article.title}
                </option>
              ))}

            </select>

          </div>

          {/* LOADING */}

          {loading ? (

            <div className="py-12 text-center text-slate-500">
              Loading AI analysis reports...
            </div>

          ) : filteredAnalyses.length === 0 ? (

            <div className="rounded-xl border border-dashed py-12 text-center">

              <p className="text-lg font-semibold text-slate-700">
                No AI Analysis Found
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Save your first analysis report to get started.
              </p>

            </div>

          ) : (

            <div className="grid gap-5 lg:grid-cols-2">

              {filteredAnalyses.map((item) => (

                <article
                  key={item.id}
                  className="rounded-xl border p-5 transition hover:shadow-md"
                >

                  <div className="mb-4 flex items-center justify-between gap-3">

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        toolStyles[item.tool_name] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.tool_name}
                    </span>

                    <span className="text-xs text-slate-400">
                      ID: #{item.id}
                    </span>

                  </div>

                  <h3 className="line-clamp-2 font-bold leading-6">
                    {getArticleTitle(item.article_id)}
                  </h3>

                  <div className="mt-3 space-y-2 text-sm text-slate-500">

                    <p>
                      <strong>Model:</strong>{" "}
                      {item.model_version || "Not specified"}
                    </p>

                    <p>
                      <strong>Extracted Claims:</strong>{" "}
                      {item.claims_extracted}
                    </p>

                    <p>
                      <strong>Analysis Date:</strong>{" "}
                      {formatDate(item.analysis_date)}
                    </p>

                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">

                    <button
                      onClick={() => setSelectedAnalysis(item)}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                    >
                      View Full Analysis
                    </button>

                    <button
                      onClick={() => void handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === item.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

        {/* ANALYSIS DETAILS MODAL */}

        {selectedAnalysis && (

          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedAnalysis(null)}
          >

            <div
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl md:p-8"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="mb-6 flex items-start justify-between gap-4">

                <div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {selectedAnalysis.tool_name}
                  </span>

                  <h2 className="mt-3 text-xl font-bold">
                    AI Analysis Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {getArticleTitle(selectedAnalysis.article_id)}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="rounded-lg px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100"
                  aria-label="Close analysis"
                >
                  ×
                </button>

              </div>

              <div className="mb-6 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">

                <div>
                  <p className="text-xs text-slate-500">Model</p>
                  <p className="mt-1 font-semibold">
                    {selectedAnalysis.model_version || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Extracted Claims</p>
                  <p className="mt-1 font-semibold">
                    {selectedAnalysis.claims_extracted}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Analysis Date</p>
                  <p className="mt-1 font-semibold">
                    {formatDate(selectedAnalysis.analysis_date)}
                  </p>
                </div>

              </div>

              <DetailSection
                title="Complete AI Analysis"
                content={selectedAnalysis.analysis_text}
              />

              <DetailSection
                title="Suggested Sources"
                content={selectedAnalysis.source_suggestions}
              />

              <DetailSection
                title="AI Limitations"
                content={selectedAnalysis.limitations}
              />

              {/* CLAIM EXTRACTION BUTTON */}

<div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">

  <h3 className="font-bold text-blue-900">
    Extract Candidate Claims
  </h3>

  <p className="mt-2 text-sm leading-6 text-blue-800">
    Extract numbered and bulleted statements from this
    AI report. Review and edit the extracted candidates
    before importing them into the Claims Repository.
  </p>

  <p className="mt-2 text-xs text-amber-800">
    Note: Extraction does not verify whether a statement is true or false.
  </p>

  <button
    onClick={() =>
      extractCandidateClaims(selectedAnalysis)
    }
    className="mt-4 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
  >
    Extract Claims for Review
  </button>

</div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="rounded-lg border px-5 py-2 font-medium hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

            </div>

          </div>

        )}


{/* ================================== */}
{/* CLAIM EXTRACTION REVIEW PANEL */}
{/* ================================== */}

{extractingFrom && (

  <section className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm md:p-7">

    {/* HEADER */}

    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">

      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Claim Extraction & Review
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Source: {extractingFrom.tool_name} |
          Analysis ID: #{extractingFrom.id}
        </p>
      </div>

      <button
        onClick={() => {
          setCandidateClaims([]);
          setExtractingFrom(null);
        }}
        className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
      >
        Close Review
      </button>

    </div>

    {/* WARNING */}

    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">

      <strong>Human Review Required:</strong>

      <p className="mt-1">
        These statements are extracted from an AI-generated
        report. They are not verified facts. Review each
        statement and remove opinions, predictions,
        irrelevant content and duplicates before saving.
      </p>

    </div>

    {/* SELECTION SUMMARY */}

    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

      <p className="text-sm font-medium text-slate-700">

        Total Candidates: {candidateClaims.length}

        {" | "}

        Selected: {
          candidateClaims.filter(
            (item) => item.selected
          ).length
        }

      </p>

      <div className="flex gap-3">

        <button
          onClick={() =>
            setCandidateClaims((previous) =>
              previous.map((item) => ({
                ...item,
                selected: true,
              }))
            )
          }
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          Select All
        </button>

        <button
          onClick={() =>
            setCandidateClaims((previous) =>
              previous.map((item) => ({
                ...item,
                selected: false,
              }))
            )
          }
          className="text-sm font-semibold text-slate-600 hover:underline"
        >
          Deselect All
        </button>

      </div>

    </div>

    {/* CANDIDATE LIST */}

    <div className="mt-4 space-y-4">

      {candidateClaims.length === 0 ? (

        <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
          No candidate claims available.
        </div>

      ) : (

        candidateClaims.map((item) => (

          <div
            key={item.id}
            className={`rounded-xl border p-4 transition ${
              item.selected
                ? "border-blue-200 bg-blue-50/30"
                : "border-slate-200 bg-white"
            }`}
          >

            {/* ITEM HEADER */}

            <div className="flex items-center justify-between gap-3">

              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">

                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() =>
                    toggleCandidateClaim(item.id)
                  }
                  className="h-4 w-4"
                />

                Candidate #{item.id}

              </label>

              <button
                onClick={() =>
                  removeCandidateClaim(item.id)
                }
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Remove
              </button>

            </div>

            {/* EDIT CLAIM */}

            <textarea
              value={item.claim_text}
              onChange={(e) =>
                updateCandidateClaim(
                  item.id,
                  e.target.value
                )
              }
              rows={3}
              className="form-input mt-3"
              placeholder="Review and edit the candidate claim..."
            />

            {/* STATUS */}

            <div className="mt-2 flex items-center justify-between">

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                Needs Human Review
              </span>

              <span className="text-xs text-slate-400">
                {item.claim_text.trim().length} characters
              </span>

            </div>

          </div>

        ))

      )}

    </div>

    {/* ACTION BUTTONS */}

    <div className="mt-6 flex flex-wrap gap-3 border-t pt-5">

      <button
        onClick={() => void saveCandidateClaims()}
        disabled={
          bulkSaving ||
          candidateClaims.filter(
            (item) =>
              item.selected &&
              item.claim_text.trim().length >= 25
          ).length === 0
        }
        className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {bulkSaving
          ? "Importing Claims..."
          : "Save Selected Claims"}
      </button>

      <button
        onClick={() => setCandidateClaims([])}
        disabled={bulkSaving}
        className="rounded-lg border px-5 py-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
      >
        Clear All
      </button>

    </div>

  </section>

)}

        {/* DISCLAIMER */}

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">

          <strong>Verification Notice:</strong>{" "}
          AI-generated reports and suggested sources are stored
          for analysis and comparison. They are not independently
          verified facts. Human fact-checking is required before
          assigning final claim verdicts.

        </div>

      </div>

      {/* SHARED STYLES */}

      <style jsx global>{`
        .form-input {
          display: block;
          width: 100%;
          border: 1px solid #dbe2ea;
          border-radius: 8px;
          padding: 11px 13px;
          background: white;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      `}</style>

    </main>
  );
}


// REUSABLE STAT CARD

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {subtitle}
      </p>

    </div>
  );
}


// REUSABLE FORM FIELD

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">

      {label}

      <div className="mt-2">
        {children}
      </div>

    </label>
  );
}


// REUSABLE DETAIL SECTION

function DetailSection({
  title,
  content,
}: {
  title: string;
  content: string | null;
}) {
  if (!content) return null;

  return (
    <section className="mb-6">

      <h3 className="mb-2 font-bold">
        {title}
      </h3>

      <div className="whitespace-pre-wrap break-words rounded-xl border bg-slate-50 p-4 text-sm leading-7 text-slate-700">
        {content}
      </div>

    </section>
  );
}