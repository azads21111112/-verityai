"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://verityai-backend-7m7y.onrender.com";

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
  source_type: string | null;
  excerpt: string | null;
  description: string | null;
  reliability_score: number | null;
  published_at: string | null;
  accessed_at: string | null;
  created_at: string | null;
};

type EvidenceForm = {
  title: string;
  source_name: string;
  source_url: string;
  evidence_type: string;
  source_type: string;
  excerpt: string;
  description: string;
  reliability_score: string;
  published_at: string;
  accessed_at: string;
};

const emptyForm: EvidenceForm = {
  title: "",
  source_name: "",
  source_url: "",
  evidence_type: "supporting",
  source_type: "News",
  excerpt: "",
  description: "",
  reliability_score: "50",
  published_at: "",
  accessed_at: new Date().toISOString().slice(0, 10),
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function formatDate(value: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString();
}

function evidencePayload(form: EvidenceForm) {
  return {
    title: form.title.trim(),
    source_name: form.source_name.trim(),
    source_url: form.source_url.trim(),
    evidence_type: form.evidence_type,
    source_type: form.source_type.trim() || null,
    excerpt: form.excerpt.trim() || null,
    description: form.description.trim() || null,
    reliability_score: Number(form.reliability_score),
    published_at: form.published_at
      ? new Date(`${form.published_at}T12:00:00`).toISOString()
      : null,
    accessed_at: form.accessed_at
      ? new Date(`${form.accessed_at}T12:00:00`).toISOString()
      : null,
  };
}

export default function EvidencePage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [claimFilter, setClaimFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [reliabilityFilter, setReliabilityFilter] = useState("all");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [showForm, setShowForm] = useState(false);
  const [editingEvidence, setEditingEvidence] =
    useState<Evidence | null>(null);

  const [selectedEvidence, setSelectedEvidence] =
    useState<Evidence | null>(null);

  const [form, setForm] = useState<EvidenceForm>(emptyForm);
  const [selectedClaim, setSelectedClaim] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [claimsResponse, evidenceResponse] = await Promise.all([
        fetch(`${API_URL}/api/claims/`),
        fetch(`${API_URL}/api/evidences/?limit=500&offset=0`),
      ]);

      if (!claimsResponse.ok || !evidenceResponse.ok) {
        throw new Error("Unable to load repository data.");
      }

      const claimsData: Claim[] = await claimsResponse.json();
      const evidenceData: Evidence[] = await evidenceResponse.json();

      setClaims(claimsData);
      setEvidences(evidenceData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredEvidences = useMemo(() => {
    return evidences.filter((item) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        !searchText ||
        item.title.toLowerCase().includes(searchText) ||
        item.source_name.toLowerCase().includes(searchText) ||
        (item.excerpt || "").toLowerCase().includes(searchText) ||
        String(item.id).includes(searchText);

      const matchesClaim =
        claimFilter === "all" ||
        String(item.claim_id) === claimFilter;

      const matchesType =
        typeFilter === "all" ||
        item.evidence_type === typeFilter;

      const matchesSource =
        sourceFilter === "all" ||
        (item.source_type || "").toLowerCase() ===
          sourceFilter.toLowerCase();

      let matchesReliability = true;

      if (reliabilityFilter === "high") {
        matchesReliability =
          item.reliability_score !== null &&
          item.reliability_score >= 80;
      }

      if (reliabilityFilter === "medium") {
        matchesReliability =
          item.reliability_score !== null &&
          item.reliability_score >= 50 &&
          item.reliability_score < 80;
      }

      if (reliabilityFilter === "low") {
        matchesReliability =
          item.reliability_score !== null &&
          item.reliability_score < 50;
      }

      return (
        matchesSearch &&
        matchesClaim &&
        matchesType &&
        matchesSource &&
        matchesReliability
      );
    });
  }, [
    evidences,
    search,
    claimFilter,
    typeFilter,
    sourceFilter,
    reliabilityFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvidences.length / pageSize)
  );

  const paginatedEvidences = filteredEvidences.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    claimFilter,
    typeFilter,
    sourceFilter,
    reliabilityFilter,
  ]);

  const supportingCount = evidences.filter(
    (item) => item.evidence_type === "supporting"
  ).length;

  const contradictingCount = evidences.filter(
    (item) => item.evidence_type === "contradicting"
  ).length;

  const neutralCount = evidences.filter(
    (item) => item.evidence_type === "neutral"
  ).length;

  const averageReliability = evidences.length
    ? Math.round(
        evidences.reduce(
          (sum, item) => sum + (item.reliability_score ?? 0),
          0
        ) / evidences.length
      )
    : 0;

  function openAddModal() {
    setEditingEvidence(null);
    setSelectedClaim(claims[0] ? String(claims[0].id) : "");
    setForm({
      ...emptyForm,
      accessed_at: new Date().toISOString().slice(0, 10),
    });
    setMessage("");
    setShowForm(true);
  }

  function openEditModal(item: Evidence) {
    setEditingEvidence(item);
    setSelectedClaim(String(item.claim_id));

    setForm({
      title: item.title,
      source_name: item.source_name,
      source_url: item.source_url,
      evidence_type: item.evidence_type,
      source_type: item.source_type || "",
      excerpt: item.excerpt || "",
      description: item.description || "",
      reliability_score: String(item.reliability_score ?? 50),
      published_at: item.published_at
        ? item.published_at.slice(0, 10)
        : "",
      accessed_at: item.accessed_at
        ? item.accessed_at.slice(0, 10)
        : "",
    });

    setMessage("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedClaim) {
      setMessage("Please select a claim.");
      return;
    }

    if (!form.title.trim() || !form.source_name.trim()) {
      setMessage("Title and source name are required.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const isEditing = editingEvidence !== null;

      const url = isEditing
        ? `${API_URL}/api/claims/${selectedClaim}/evidences/${editingEvidence.id}`
        : `${API_URL}/api/claims/${selectedClaim}/evidences/`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(evidencePayload(form)),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to save evidence."
        );
      }

      setShowForm(false);
      setEditingEvidence(null);
      setForm(emptyForm);

      await loadData();

      setMessage(
        isEditing
          ? "Evidence updated successfully."
          : "Evidence added successfully."
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: Evidence) {
    const confirmed = window.confirm(
      `Delete evidence "${item.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/claims/${item.claim_id}/evidences/${item.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Unable to delete evidence.");
      }

      setSelectedEvidence(null);
      setMessage("Evidence deleted successfully.");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Delete failed."
      );
    }
  }

  function badgeClass(type: string) {
    if (type === "supporting") {
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    }

    if (type === "contradicting") {
      return "bg-red-50 text-red-700 ring-red-200";
    }

    return "bg-slate-100 text-slate-700 ring-slate-200";
  }

  function reliabilityClass(score: number | null) {
    if (score === null) return "text-slate-400";

    if (score >= 80) return "text-emerald-600";

    if (score >= 50) return "text-amber-600";

    return "text-red-600";
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-7 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Verification Workspace
            </p>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Evidence Repository
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Collect, organize and evaluate evidence associated with claims.
            </p>
          </div>

          <button
            onClick={openAddModal}
            disabled={claims.length === 0}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add Evidence
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            {message}
          </div>
        )}

        {/* Statistics */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Evidence",
              value: evidences.length,
              color: "text-blue-600",
              icon: "▤",
            },
            {
              label: "Supporting",
              value: supportingCount,
              color: "text-emerald-600",
              icon: "✓",
            },
            {
              label: "Contradicting",
              value: contradictingCount,
              color: "text-red-600",
              icon: "!",
            },
            {
              label: "Neutral",
              value: neutralCount,
              color: "text-slate-600",
              icon: "○",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>

                <span className={`text-2xl ${card.color}`}>
                  {card.icon}
                </span>
              </div>

              <p className={`mt-4 text-3xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </section>

        {/* Repository Summary */}
        <section className="mb-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Average Reliability Score
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Average of recorded scores, not an independently verified rating.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-blue-600">
              {averageReliability}%
            </span>

            <button
              onClick={() => void loadData()}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ↻ Refresh
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">
                Search & Filters
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Refine evidence records using multiple criteria.
              </p>
            </div>

            <button
              onClick={() => {
                setSearch("");
                setClaimFilter("all");
                setTypeFilter("all");
                setSourceFilter("all");
                setReliabilityFilter("all");
              }}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, source, excerpt..."
              className={inputClass}
            />

            <select
              value={claimFilter}
              onChange={(e) => setClaimFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All Claims</option>

              {claims.map((claim) => (
                <option key={claim.id} value={claim.id}>
                  Claim #{claim.id}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All Evidence Types</option>
              <option value="supporting">Supporting</option>
              <option value="contradicting">Contradicting</option>
              <option value="neutral">Neutral</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All Source Types</option>
              <option value="official">Official</option>
              <option value="news">News</option>
              <option value="research">Research</option>
              <option value="academic">Academic</option>
              <option value="government">Government</option>
            </select>

            <select
              value={reliabilityFilter}
              onChange={(e) => setReliabilityFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All Reliability</option>
              <option value="high">High (80–100)</option>
              <option value="medium">Medium (50–79)</option>
              <option value="low">Low (0–49)</option>
            </select>
          </div>
        </section>

        {/* Evidence Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-lg font-bold">
                Evidence Records
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {filteredEvidences.length} matching records
              </p>
            </div>

            <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              Page {page} of {totalPages}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Loading evidence repository...
            </div>
          ) : paginatedEvidences.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-semibold text-slate-700">
                No evidence found
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Try changing your filters or add a new evidence record.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Evidence</th>
                      <th className="px-5 py-4">Claim</th>
                      <th className="px-5 py-4">Publisher</th>
                      <th className="px-5 py-4">Position</th>
                      <th className="px-5 py-4">Reliability</th>
                      <th className="px-5 py-4">Published</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedEvidences.map((item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="max-w-[260px] px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID: #{item.id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold">
                            #{item.claim_id}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-700">
                            {item.source_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.source_type || "Unspecified"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass(
                              item.evidence_type
                            )}`}
                          >
                            {item.evidence_type}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`font-bold ${reliabilityClass(
                              item.reliability_score
                            )}`}
                          >
                            {item.reliability_score === null
                              ? "N/A"
                              : `${item.reliability_score}%`}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {formatDate(item.published_at)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedEvidence(item)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                            >
                              View
                            </button>

                            <button
                              onClick={() => openEditModal(item)}
                              className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => void handleDelete(item)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5">
                <p className="text-xs text-slate-500">
                  Showing {(page - 1) * pageSize + 1}–
                  {Math.min(
                    page * pageSize,
                    filteredEvidences.length
                  )}{" "}
                  of {filteredEvidences.length}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Add / Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
            <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingEvidence ? "Edit Evidence" : "Add New Evidence"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Enter traceable source information and relevant evidence.
                  </p>
                </div>

                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Associated Claim
                  </label>

                  <select
                    value={selectedClaim}
                    onChange={(e) => setSelectedClaim(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select claim</option>

                    {claims.map((claim) => (
                      <option key={claim.id} value={claim.id}>
                        #{claim.id} — {claim.title}
                      </option>
                    ))}
                  </select>
                </div>

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
                    className={inputClass}
                    placeholder="Enter evidence title"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Publisher / Source Name
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
                      className={inputClass}
                      placeholder="e.g. Reuters"
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
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Evidence Position
                    </label>

                    <select
                      value={form.evidence_type}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          evidence_type: e.target.value,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="supporting">Supporting</option>
                      <option value="contradicting">Contradicting</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
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
                      className={inputClass}
                    >
                      <option value="Official">Official</option>
                      <option value="News">News</option>
                      <option value="Research">Research</option>
                      <option value="Academic">Academic</option>
                      <option value="Government">Government</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Reliability (0–100)
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
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Publication Date
                    </label>

                    <input
                      type="date"
                      value={form.published_at}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          published_at: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Access Date
                    </label>

                    <input
                      type="date"
                      value={form.accessed_at}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          accessed_at: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Relevant Source Excerpt
                  </label>

                  <textarea
                    rows={4}
                    value={form.excerpt}
                    onChange={(e) =>
                      setForm({ ...form, excerpt: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Paste the relevant passage from the source..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Evidence Description / Verification Notes
                  </label>

                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="Explain how this source relates to the claim..."
                  />
                </div>

                {message && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {message}
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting
                      ? "Saving..."
                      : editingEvidence
                        ? "Update Evidence"
                        : "Save Evidence"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Evidence Details Modal */}
        {selectedEvidence && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
            <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Evidence #{selectedEvidence.id}
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Evidence Details
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="rounded-lg px-3 py-2 text-xl hover:bg-slate-100"
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <h3 className="text-lg font-bold">
                    {selectedEvidence.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Claim ID: #{selectedEvidence.claim_id}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Publisher</p>
                    <p className="mt-1 font-semibold">
                      {selectedEvidence.source_name}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Source Type</p>
                    <p className="mt-1 font-semibold">
                      {selectedEvidence.source_type || "Unspecified"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Position</p>
                    <p className="mt-1 font-semibold capitalize">
                      {selectedEvidence.evidence_type}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">
                      Recorded Reliability Score
                    </p>
                    <p
                      className={`mt-1 font-bold ${reliabilityClass(
                        selectedEvidence.reliability_score
                      )}`}
                    >
                      {selectedEvidence.reliability_score ?? "N/A"}
                      {selectedEvidence.reliability_score !== null
                        ? "%"
                        : ""}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Source Excerpt
                  </p>

                  <div className="rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                    {selectedEvidence.excerpt || "No excerpt recorded."}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Verification Notes
                  </p>

                  <p className="text-sm leading-7 text-slate-600">
                    {selectedEvidence.description || "No description recorded."}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">
                      Publication Date
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(selectedEvidence.published_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Access Date
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(selectedEvidence.accessed_at)}
                    </p>
                  </div>
                </div>

                <a
                  href={selectedEvidence.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-all rounded-xl bg-blue-50 p-4 text-sm font-medium text-blue-700 hover:underline"
                >
                  Open Original Source ↗
                  <br />
                  {selectedEvidence.source_url}
                </a>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const item = selectedEvidence;
                      setSelectedEvidence(null);
                      openEditModal(item);
                    }}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Edit Evidence
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-8 border-t border-slate-200 py-5 text-center text-xs text-slate-400">
          VerityAI — AI Fake News & Verification Hub
        </footer>
      </div>
    </main>
  );
}
