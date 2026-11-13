"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ==========================================
// TYPES
// ==========================================

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
  evidence_type: "supporting" | "contradicting" | "neutral";
  excerpt: string | null;
  description: string | null;
  reliability_score: number | null;
  published_at: string | null;
  accessed_at: string | null;
};

type EvidenceForm = {
  title: string;
  source_name: string;
  source_url: string;
  source_type: string;
  evidence_type: "supporting" | "contradicting" | "neutral";
  excerpt: string;
  description: string;
  reliability_score: string;
  published_at: string;
  accessed_at: string;
};

type ReviewForm = {
  verdict: string;
  review_notes: string;
};

// ==========================================
// CONSTANTS
// ==========================================

const VERDICTS = [
  "Verified",
  "False",
  "Misleading",
  "Unverifiable",
  "Partially True",
];

const EMPTY_EVIDENCE_FORM: EvidenceForm = {
  title: "",
  source_name: "",
  source_url: "",
  source_type: "",
  evidence_type: "supporting",
  excerpt: "",
  description: "",
  reliability_score: "",
  published_at: "",
  accessed_at: "",
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function HumanReviewPage() {
  const [claims, setClaims] = useState<Claim[]>([]);

  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] = useState<number | null>(null);

  const [evidenceSaving, setEvidenceSaving] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  const [reviews, setReviews] = useState<
    Record<number, ReviewForm>
  >({});

  const [evidences, setEvidences] = useState<
    Record<number, Evidence[]>
  >({});

  const [evidenceForms, setEvidenceForms] = useState<
    Record<number, EvidenceForm>
  >({});

  // ==========================================
  // MESSAGE HANDLER
  // ==========================================

  function showMessage(
    text: string,
    type: "success" | "error" | "info" = "info"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  // ==========================================
  // LOAD CLAIMS + EVIDENCE
  // ==========================================

  async function loadClaims() {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/claims/`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Unable to load claims.");
      }

      const data: Claim[] = await response.json();

      setClaims(data);

      // Load evidence for each claim
      const evidenceResults = await Promise.all(
        data.map(async (claim) => {
          try {
            const evidenceResponse = await fetch(
              `${API_URL}/api/claims/${claim.id}/evidences/`,
              { cache: "no-store" }
            );

            if (!evidenceResponse.ok) {
              return [claim.id, []] as const;
            }

            const items: Evidence[] =
              await evidenceResponse.json();

            return [claim.id, items] as const;
          } catch {
            return [claim.id, []] as const;
          }
        })
      );

      setEvidences(
        Object.fromEntries(evidenceResults)
      );

      // Initialize review forms
      const initialReviews: Record<
        number,
        ReviewForm
      > = {};

      data.forEach((claim) => {
        initialReviews[claim.id] = {
          verdict: claim.verdict || "Unverifiable",
          review_notes: claim.review_notes || "",
        };
      });

      setReviews(initialReviews);

    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Backend connection failed.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    void loadClaims();
  }, []);

  // ==========================================
  // UPDATE HUMAN REVIEW FORM
  // ==========================================

  function updateReview(
    claimId: number,
    field: keyof ReviewForm,
    value: string
  ) {
    setReviews((previous) => ({
      ...previous,
      [claimId]: {
        ...(previous[claimId] || {
          verdict: "Unverifiable",
          review_notes: "",
        }),
        [field]: value,
      },
    }));
  }

  // ==========================================
  // UPDATE EVIDENCE FORM
  // ==========================================

  function updateEvidenceForm(
    claimId: number,
    field: keyof EvidenceForm,
    value: string
  ) {
    setEvidenceForms((previous) => ({
      ...previous,
      [claimId]: {
        ...(previous[claimId] || EMPTY_EVIDENCE_FORM),
        [field]: value,
      },
    }));
  }

  // ==========================================
  // SUBMIT NEW EVIDENCE
  // ==========================================

  async function submitEvidence(claimId: number) {
    const form =
      evidenceForms[claimId] || EMPTY_EVIDENCE_FORM;

    if (
      !form.title.trim() ||
      !form.source_name.trim() ||
      !form.source_url.trim()
    ) {
      showMessage(
        "Evidence title, publisher and source URL are required.",
        "error"
      );
      return;
    }

    try {
      setEvidenceSaving(claimId);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/claims/${claimId}/evidences/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title.trim(),
            source_name: form.source_name.trim(),
            source_url: form.source_url.trim(),
            source_type: form.source_type.trim() || null,
            evidence_type: form.evidence_type,
            excerpt: form.excerpt.trim() || null,
            description: form.description.trim() || null,

            reliability_score:
              form.reliability_score !== ""
                ? Number(form.reliability_score)
                : null,

            published_at: form.published_at
              ? new Date(
                  `${form.published_at}T12:00:00`
                ).toISOString()
              : null,

            accessed_at: form.accessed_at
              ? new Date(
                  `${form.accessed_at}T12:00:00`
                ).toISOString()
              : null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Evidence submission failed."
        );
      }

      // Reset form
      setEvidenceForms((previous) => ({
        ...previous,
        [claimId]: { ...EMPTY_EVIDENCE_FORM },
      }));

      // Reload evidence for this claim
      const evidenceResponse = await fetch(
        `${API_URL}/api/claims/${claimId}/evidences/`,
        { cache: "no-store" }
      );

      if (evidenceResponse.ok) {
        const updatedEvidence: Evidence[] =
          await evidenceResponse.json();

        setEvidences((previous) => ({
          ...previous,
          [claimId]: updatedEvidence,
        }));
      }

      showMessage(
        `Evidence #${result.id} successfully saved for Claim #${claimId}.`,
        "success"
      );

    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Evidence submission failed.",
        "error"
      );
    } finally {
      setEvidenceSaving(null);
    }
  }

  // ==========================================
  // SUBMIT HUMAN REVIEW
  // ==========================================

  async function submitReview(claimId: number) {
    const review = reviews[claimId];

    if (!review?.review_notes.trim()) {
      showMessage(
        "Please provide evidence-based investigation notes.",
        "error"
      );
      return;
    }

    setSavingId(claimId);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/claims/${claimId}/human-review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verdict: review.verdict,
            review_notes: review.review_notes.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Human review failed."
        );
      }

      showMessage(
        `Human fact-checking completed for Claim #${claimId}.`,
        "success"
      );

      await loadClaims();

    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
        "error"
      );
    } finally {
      setSavingId(null);
    }
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  const reviewedCount = claims.filter(
    (claim) => claim.status === "human_reviewed"
  ).length;

  const pendingCount =
    claims.length - reviewedCount;

  const totalEvidence = Object.values(evidences)
    .reduce((total, items) => total + items.length, 0);

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white md:p-8">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <a
          href="/"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to Dashboard
        </a>

        <div className="mb-8 mt-5">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            VerityAI Investigation
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Human Fact-Checking
          </h1>

          <p className="mt-2 text-slate-400">
            Independently investigate AI-extracted claims
            using reliable evidence and record a human verdict.
          </p>

        </div>

        {/* STATISTICS */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Claims
            </p>

            <p className="mt-2 text-3xl font-bold">
              {claims.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Human Reviewed
            </p>

            <p className="mt-2 text-3xl font-bold text-green-400">
              {reviewedCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Pending Review
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Evidence
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-400">
              {totalEvidence}
            </p>
          </div>

        </div>

        {/* GLOBAL MESSAGE */}

        {message && (
          <div
            className={`mb-5 rounded-lg border p-4 text-sm ${
              messageType === "success"
                ? "border-green-800 bg-green-950 text-green-200"
                : messageType === "error"
                ? "border-red-800 bg-red-950 text-red-200"
                : "border-blue-800 bg-blue-950 text-blue-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* LOADING */}

        {loading ? (

          <div className="py-20 text-center text-slate-400">
            Loading claims and evidence repository...
          </div>

        ) : claims.length === 0 ? (

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            No claims available for investigation.
          </div>

        ) : (

          <div className="space-y-6">

            {claims.map((claim) => {

              const review = reviews[claim.id];

              const claimEvidence =
                evidences[claim.id] || [];

              const claimForm =
                evidenceForms[claim.id] ||
                EMPTY_EVIDENCE_FORM;

              const supportingCount =
                claimEvidence.filter(
                  (e) => e.evidence_type === "supporting"
                ).length;

              const contradictingCount =
                claimEvidence.filter(
                  (e) => e.evidence_type === "contradicting"
                ).length;

              const neutralCount =
                claimEvidence.filter(
                  (e) => e.evidence_type === "neutral"
                ).length;

              return (

                <section
                  key={claim.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5 md:p-7"
                >

                  {/* CLAIM HEADER */}

                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

                    <span className="text-sm font-semibold text-blue-400">
                      CLAIM #{claim.id}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        claim.status === "human_reviewed"
                          ? "bg-green-950 text-green-400"
                          : "bg-yellow-950 text-yellow-400"
                      }`}
                    >
                      {claim.status || "pending"}
                    </span>

                  </div>

                  {/* CLAIM DETAILS */}

                  <h2 className="text-xl font-bold">
                    {claim.title}
                  </h2>

                  <p className="mt-3 leading-7 text-slate-300">
                    {claim.claim_text}
                  </p>

                  <div className="mt-4 text-sm text-slate-400">
                    Category: {claim.category || "Uncategorized"}
                  </div>

                  {claim.source_url && (

                    <a
                      href={claim.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block break-all text-sm text-blue-400 hover:underline"
                    >
                      View Original Source ↗
                    </a>

                  )}

                  {/* ================================= */}
                  {/* EVIDENCE REPOSITORY */}
                  {/* ================================= */}

                  <div className="mt-7 border-t border-slate-800 pt-6">

                    <h3 className="mb-4 text-xl font-bold">
                      Evidence Repository
                    </h3>

                    {/* EVIDENCE STATISTICS */}

                    <div className="mb-5 grid gap-3 sm:grid-cols-3">

                      <div className="rounded-lg bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">
                          Supporting
                        </p>

                        <p className="mt-1 text-2xl font-bold text-green-400">
                          {supportingCount}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">
                          Contradicting
                        </p>

                        <p className="mt-1 text-2xl font-bold text-red-400">
                          {contradictingCount}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">
                          Neutral
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-300">
                          {neutralCount}
                        </p>
                      </div>

                    </div>

                    {/* EXISTING EVIDENCE */}

                    {claimEvidence.length === 0 ? (

                      <div className="rounded-lg border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">
                        No evidence added yet for this claim.
                      </div>

                    ) : (

                      <div className="space-y-3">

                        {claimEvidence.map((evidence) => (

                          <div
                            key={evidence.id}
                            className="rounded-lg border border-slate-700 bg-slate-950 p-4"
                          >

                            <div className="flex flex-wrap justify-between gap-3">

                              <h4 className="font-semibold">
                                {evidence.title}
                              </h4>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  evidence.evidence_type === "supporting"
                                    ? "bg-green-950 text-green-400"
                                    : evidence.evidence_type === "contradicting"
                                    ? "bg-red-950 text-red-400"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                {evidence.evidence_type}
                              </span>

                            </div>

                            <p className="mt-2 text-sm text-slate-400">
                              Publisher: {evidence.source_name}
                            </p>

                            {evidence.source_type && (
                              <p className="mt-1 text-xs text-slate-500">
                                Source Type: {evidence.source_type}
                              </p>
                            )}

                            {evidence.excerpt && (

                              <div className="mt-3 rounded-lg border-l-2 border-blue-500 bg-slate-900 p-3">

                                <p className="text-xs font-semibold text-blue-400">
                                  SOURCE EXCERPT
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                  {evidence.excerpt}
                                </p>

                              </div>

                            )}

                            {evidence.description && (

                              <p className="mt-3 text-sm leading-6 text-slate-400">
                                {evidence.description}
                              </p>

                            )}

                            <a
                              href={evidence.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-block break-all text-sm text-blue-400 hover:underline"
                            >
                              Open Original Evidence ↗
                            </a>

                            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">

                              <span>
                                Evidence ID: #{evidence.id}
                              </span>

                              <span>
                                Reliability:{" "}
                                {evidence.reliability_score ?? "Not assessed"}
                                {evidence.reliability_score !== null
                                  ? "/100"
                                  : ""}
                              </span>

                              <span>
                                Published:{" "}
                                {evidence.published_at
                                  ? new Date(
                                      evidence.published_at
                                    ).toLocaleDateString()
                                  : "Not provided"}
                              </span>

                              <span>
                                Accessed:{" "}
                                {evidence.accessed_at
                                  ? new Date(
                                      evidence.accessed_at
                                    ).toLocaleDateString()
                                  : "Not provided"}
                              </span>

                            </div>

                          </div>

                        ))}

                      </div>

                    )}

                    {/* ================================= */}
                    {/* ADD EVIDENCE FORM */}
                    {/* ================================= */}

                    <details className="mt-5 rounded-lg border border-slate-700 bg-slate-950 p-4">

                      <summary className="cursor-pointer font-semibold text-blue-400">
                        + Add New Evidence
                      </summary>

                      <div className="mt-5 space-y-4">

                        {/* TITLE */}

                        <div>
                          <label className="mb-2 block text-sm text-slate-300">
                            Evidence Title *
                          </label>

                          <input
                            value={claimForm.title}
                            onChange={(e) =>
                              updateEvidenceForm(
                                claim.id,
                                "title",
                                e.target.value
                              )
                            }
                            placeholder="Evidence title"
                            maxLength={250}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* PUBLISHER + URL */}

                        <div className="grid gap-4 md:grid-cols-2">

                          <div>
                            <label className="mb-2 block text-sm text-slate-300">
                              Publisher / Organization *
                            </label>

                            <input
                              value={claimForm.source_name}
                              onChange={(e) =>
                                updateEvidenceForm(
                                  claim.id,
                                  "source_name",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Reuters, BBC, WHO"
                              maxLength={250}
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-slate-300">
                              Original Source URL *
                            </label>

                            <input
                              type="url"
                              value={claimForm.source_url}
                              onChange={(e) =>
                                updateEvidenceForm(
                                  claim.id,
                                  "source_url",
                                  e.target.value
                                )
                              }
                              placeholder="https://example.com/article"
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-blue-500"
                            />
                          </div>

                        </div>

                        {/* SOURCE TYPE + RELIABILITY */}

                        <div className="grid gap-4 md:grid-cols-2">

                          <div>
                            <label className="mb-2 block text-sm text-slate-300">
                              Source Type
                            </label>

                            <select
                              value={claimForm.source_type}
                              onChange={(e) =>
                                updateEvidenceForm(
                                  claim.id,
                                  "source_type",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
                            >
                              <option value="">
                                Select source type
                              </option>

                              <option value="Government Report">
                                Government Report
                              </option>

                              <option value="Official Statement">
                                Official Statement
                              </option>

                              <option value="News Article">
                                News Article
                              </option>

                              <option value="Research Paper">
                                Research Paper
                              </option>

                              <option value="Academic Study">
                                Academic Study
                              </option>

                              <option value="International Organization">
                                International Organization
                              </option>

                              <option value="Fact Check">
                                Fact Check
                              </option>

                              <option value="Other">
                                Other
                              </option>

                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-slate-300">
                              Reliability Score (0–100)
                            </label>

                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={claimForm.reliability_score}
                              onChange={(e) =>
                                updateEvidenceForm(
                                  claim.id,
                                  "reliability_score",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. 90"
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
                            />
                          </div>

                        </div>

                        {/* EVIDENCE CLASSIFICATION */}

                        <div>
                          <label className="mb-2 block text-sm text-slate-300">
                            Evidence Classification *
                          </label>

                          <select
                            value={claimForm.evidence_type}
                            onChange={(e) =>
                              updateEvidenceForm(
                                claim.id,
                                "evidence_type",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
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

                        {/* EXCERPT */}

                        <div>
                          <label className="mb-2 block text-sm text-slate-300">
                            Relevant Source Excerpt
                          </label>

                          <textarea
                            rows={4}
                            value={claimForm.excerpt}
                            onChange={(e) =>
                              updateEvidenceForm(
                                claim.id,
                                "excerpt",
                                e.target.value
                              )
                            }
                            placeholder="Copy the relevant passage from the original source..."
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
                          />
                        </div>

                        {/* DESCRIPTION */}

                        <div>
                          <label className="mb-2 block text-sm text-slate-300">
                            Evidence Explanation
                          </label>

                          <textarea
                            rows={3}
                            value={claimForm.description}
                            onChange={(e) =>
                              updateEvidenceForm(
                                claim.id,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Explain how this source supports, contradicts, or contextualizes the claim..."
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
                          />
                        </div>

                        {/* DATES */}

                        <div className="grid gap-4 md:grid-cols-2">

                          <div>
                            <label className="mb-2 block text-sm text-slate-300">
                              Publication Date
                            </label>

                            <input
                              type="date"
                              value={claimForm.published_at}
                              onChange={(e) =>
                                updateEvidenceForm(
                                  claim.id,
                                  "published_at",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-slate-300">
                              Access Date
                            </label>

                            <input
                              type="date"
                              value={claimForm.accessed_at}
                              onChange={(e) =>
                                updateEvidenceForm(
                                  claim.id,
                                  "accessed_at",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
                            />
                          </div>

                        </div>

                        {/* SAVE */}

                        <button
                          type="button"
                          onClick={() =>
                            submitEvidence(claim.id)
                          }
                          disabled={
                            evidenceSaving === claim.id
                          }
                          className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {evidenceSaving === claim.id
                            ? "Saving Evidence..."
                            : "Save Evidence"}
                        </button>

                      </div>

                    </details>

                  </div>

                  {/* ================================= */}
                  {/* HUMAN ASSESSMENT */}
                  {/* ================================= */}

                  <div className="mt-7 border-t border-slate-800 pt-6">

                    <h3 className="mb-4 text-xl font-bold">
                      Independent Human Assessment
                    </h3>

                    <p className="mb-5 text-sm leading-6 text-slate-400">
                      Evaluate all available evidence before
                      selecting a final verdict. Do not treat
                      absence of evidence as proof that a claim
                      is false.
                    </p>

                    {/* FINAL VERDICT */}

                    <label className="mb-2 block text-sm text-slate-400">
                      Final Verdict
                    </label>

                    <select
                      value={
                        review?.verdict || "Unverifiable"
                      }
                      onChange={(e) =>
                        updateReview(
                          claim.id,
                          "verdict",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-blue-500"
                    >
                      {VERDICTS.map((verdict) => (

                        <option
                          key={verdict}
                          value={verdict}
                        >
                          {verdict}
                        </option>

                      ))}
                    </select>

                    {/* REVIEW NOTES */}

                    <label className="mb-2 mt-5 block text-sm text-slate-400">
                      Investigation Notes and Evidence Explanation
                    </label>

                    <textarea
                      rows={5}
                      value={review?.review_notes || ""}
                      onChange={(e) =>
                        updateReview(
                          claim.id,
                          "review_notes",
                          e.target.value
                        )
                      }
                      placeholder="Explain which independent sources you checked, what the evidence establishes, and why this verdict is justified. Include source URLs and relevant details."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-blue-500"
                    />

                    {/* SUBMIT REVIEW */}

                    <button
                      type="button"
                      onClick={() =>
                        submitReview(claim.id)
                      }
                      disabled={savingId === claim.id}
                      className="mt-4 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === claim.id
                        ? "Saving Review..."
                        : "Submit Human Review"}
                    </button>

                  </div>

                </section>

              );
            })}

          </div>

        )}

        {/* FOOTER */}

        <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-xs leading-6 text-slate-500">

          VerityAI — AI-Assisted Fact-Checking and
          Human Evidence Verification Platform.

          <br />

          AI-generated analysis is a research aid,
          not proof of factual accuracy.

        </footer>

      </div>

    </main>
  );
}