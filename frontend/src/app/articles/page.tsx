"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://verityai-backend-7m7y.onrender.com";

const CATEGORIES = [
  "Politics",
  "Business",
  "Technology",
  "Health",
  "International"
] as const;

const CREDIBILITY = [
  "Not assessed",
  "High",
  "Medium",
  "Low",
  "Questionable"
] as const;

type Article = {
  id: number;
  title: string;
  publisher: string;
  author: string | null;
  publication_date: string | null;
  url: string;
  article_type: string;
  subject: string;
  summary: string | null;
  initial_credibility: string;
  credibility_notes: string | null;
  created_at: string | null;
};

type FormState = {
  title: string;
  publisher: string;
  author: string;
  publication_date: string;
  url: string;
  article_type: string;
  subject: string;
  summary: string;
  initial_credibility: string;
  credibility_notes: string;
};

const emptyForm: FormState = {
  title: "",
  publisher: "",
  author: "",
  publication_date: "",
  url: "",
  article_type: "Politics",
  subject: "",
  summary: "",
  initial_credibility: "Not assessed",
  credibility_notes: ""
};

export default function ArticlesPage() {

  const [articles, setArticles] = useState<Article[]>([]);

  const [form, setForm] = useState<FormState>(emptyForm);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [category, setCategory] = useState("All");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState(false);


  async function loadArticles() {

    setLoading(true);

    try {

      const response = await fetch(
        `${API_URL}/api/articles/`
      );

      if (!response.ok) {
        throw new Error("Could not load articles.");
      }

      setArticles(await response.json());

      setError(false);

    } catch (e) {

      setError(true);

      setMessage(
        e instanceof Error
          ? e.message
          : "Backend connection failed."
      );

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    void loadArticles();
  }, []);


  const visible = useMemo(() => {

    return articles.filter((article) => {

      const matchesCategory =
        category === "All" ||
        article.article_type === category;

      const matchesSearch =
        `${article.title} ${article.publisher} ${article.subject}`
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;

    });

  }, [articles, category, search]);


  const updateField = (
    key: keyof FormState,
    value: string
  ) => {

    setForm((previous) => ({
      ...previous,
      [key]: value
    }));

  };


  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setSaving(true);

    setMessage("");

    setError(false);

    const payload = {
      ...form,
      author: form.author || null,
      publication_date: form.publication_date || null,
      summary: form.summary || null,
      credibility_notes: form.credibility_notes || null
    };

    try {

      const response = await fetch(
        `${API_URL}/api/articles/${editingId ?? ""}`,
        {
          method: editingId ? "PATCH" : "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(payload)
        }
      );

      const result =
        response.status === 204
          ? null
          : await response.json();

      if (!response.ok) {

        throw new Error(
          result?.detail || "Could not save article."
        );

      }

      setForm(emptyForm);

      setEditingId(null);

      setMessage(
        editingId
          ? "Article updated successfully."
          : "Article added successfully."
      );

      await loadArticles();

    } catch (e) {

      setError(true);

      setMessage(
        e instanceof Error
          ? e.message
          : "Save failed."
      );

    } finally {

      setSaving(false);

    }

  }


  function edit(article: Article) {

    setEditingId(article.id);

    setForm({

      title: article.title,

      publisher: article.publisher,

      author: article.author || "",

      publication_date: article.publication_date || "",

      url: article.url,

      article_type: article.article_type,

      subject: article.subject,

      summary: article.summary || "",

      initial_credibility: article.initial_credibility,

      credibility_notes: article.credibility_notes || ""

    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  async function remove(article: Article) {

    if (
      !window.confirm(
        `Delete "${article.title}"?`
      )
    ) {
      return;
    }

    try {

      const response = await fetch(
        `${API_URL}/api/articles/${article.id}`,
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error("Delete failed.");
      }

      setMessage("Article deleted successfully.");

      await loadArticles();

    } catch (e) {

      setError(true);

      setMessage(
        e instanceof Error
          ? e.message
          : "Delete failed."
      );

    }

  }


  return (

    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">

      <div className="mx-auto max-w-7xl">

        <header className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

          <div>

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Week 6 · Step 01
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              News Article Repository
            </h1>

            <p className="mt-2 text-slate-600">
              Manage and organize selected news articles.
            </p>

          </div>

          <div className="rounded-xl border bg-white px-4 py-3 text-sm shadow-sm">

            <b className="text-2xl">
              {articles.length}
            </b>

            <p className="text-slate-500">
              Articles collected
            </p>

          </div>

        </header>


        {message && (

          <div
            className={`mb-5 rounded-xl border p-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>

        )}


        <section className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

          {CATEGORIES.map((item) => (

            <div
              key={item}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >

              <p className="text-sm text-slate-500">
                {item}
              </p>

              <p className="mt-1 text-2xl font-bold">

                {
                  articles.filter(
                    (article) =>
                      article.article_type === item
                  ).length
                }

              </p>

            </div>

          ))}

        </section>


        <section className="mb-8 rounded-2xl border bg-white p-5 shadow-sm md:p-7">

          <div className="mb-5 flex items-center justify-between gap-3">

            <div>

              <h2 className="text-xl font-bold">

                {editingId
                  ? "Edit Article"
                  : "Add News Article"}

              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the original article information.
              </p>

            </div>

            {editingId && (

              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Cancel
              </button>

            )}

          </div>


          <form
            onSubmit={submit}
            className="grid gap-4 md:grid-cols-2"
          >

            <label className="text-sm font-medium">
              Article Title *

              <input
                required
                minLength={5}
                value={form.title}
                onChange={(e) =>
                  updateField("title", e.target.value)
                }
                className="field"
              />

            </label>


            <label className="text-sm font-medium">
              Publisher *

              <input
                required
                value={form.publisher}
                onChange={(e) =>
                  updateField("publisher", e.target.value)
                }
                placeholder="Reuters, WHO, etc."
                className="field"
              />

            </label>


            <label className="text-sm font-medium">
              Author

              <input
                value={form.author}
                onChange={(e) =>
                  updateField("author", e.target.value)
                }
                className="field"
              />

            </label>


            <label className="text-sm font-medium">
              Publication Date

              <input
                type="date"
                value={form.publication_date}
                onChange={(e) =>
                  updateField(
                    "publication_date",
                    e.target.value
                  )
                }
                className="field"
              />

            </label>


            <label className="text-sm font-medium">
              Article Category *

              <select
                value={form.article_type}
                onChange={(e) =>
                  updateField(
                    "article_type",
                    e.target.value
                  )
                }
                className="field bg-white"
              >

                {CATEGORIES.map((item) => (

                  <option key={item}>
                    {item}
                  </option>

                ))}

              </select>

            </label>


            <label className="text-sm font-medium">
              Initial Credibility

              <select
                value={form.initial_credibility}
                onChange={(e) =>
                  updateField(
                    "initial_credibility",
                    e.target.value
                  )
                }
                className="field bg-white"
              >

                {CREDIBILITY.map((item) => (

                  <option key={item}>
                    {item}
                  </option>

                ))}

              </select>

            </label>


            <label className="text-sm font-medium md:col-span-2">
              Original Article URL *

              <input
                required
                type="url"
                value={form.url}
                onChange={(e) =>
                  updateField("url", e.target.value)
                }
                placeholder="https://..."
                className="field"
              />

            </label>


            <label className="text-sm font-medium md:col-span-2">
              Subject / Main Topic *

              <input
                required
                value={form.subject}
                onChange={(e) =>
                  updateField("subject", e.target.value)
                }
                className="field"
              />

            </label>


            <label className="text-sm font-medium md:col-span-2">
              Short Summary

              <textarea
                rows={3}
                value={form.summary}
                onChange={(e) =>
                  updateField("summary", e.target.value)
                }
                className="field"
              />

            </label>


            <label className="text-sm font-medium md:col-span-2">
              Initial Credibility Rationale

              <textarea
                rows={2}
                value={form.credibility_notes}
                onChange={(e) =>
                  updateField(
                    "credibility_notes",
                    e.target.value
                  )
                }
                placeholder="Explain your preliminary source assessment."
                className="field"
              />

            </label>


            <div className="md:col-span-2">

              <button
                disabled={saving}
                className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >

                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Article"
                  : "Add Article"}

              </button>

            </div>

          </form>

        </section>


        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold">
                Selected Articles
              </h2>

              <p className="text-sm text-slate-500">
                All collected articles.
              </p>

            </div>


            <div className="flex flex-col gap-2 sm:flex-row">

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search articles..."
                className="rounded-lg border px-3 py-2 text-sm"
              />


              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="rounded-lg border bg-white px-3 py-2 text-sm"
              >

                <option>All</option>

                {CATEGORIES.map((item) => (

                  <option key={item}>
                    {item}
                  </option>

                ))}

              </select>

            </div>

          </div>


          {loading ? (

            <p className="py-10 text-center text-slate-500">
              Loading articles...
            </p>

          ) : visible.length === 0 ? (

            <div className="rounded-xl border border-dashed p-10 text-center text-slate-500">
              No articles found.
            </div>

          ) : (

            <div className="space-y-4">

              {visible.map((article) => (

                <article
                  key={article.id}
                  className="rounded-xl border p-4 md:p-5"
                >

                  <div className="flex flex-col justify-between gap-3 md:flex-row">

                    <div className="min-w-0">

                      <div className="mb-2 flex flex-wrap gap-2">

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {article.article_type}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                          Initial: {article.initial_credibility}
                        </span>

                      </div>


                      <h3 className="text-lg font-bold">
                        {article.title}
                      </h3>


                      <p className="mt-1 text-sm text-slate-600">

                        {article.publisher}

                        {article.author
                          ? ` · ${article.author}`
                          : ""}

                        {article.publication_date
                          ? ` · ${article.publication_date}`
                          : ""}

                      </p>


                      <p className="mt-2 text-sm">
                        {article.subject}
                      </p>


                      {article.summary && (

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {article.summary}
                        </p>

                      )}


                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block break-all text-sm font-medium text-blue-700 hover:underline"
                      >
                        Open Original Article ↗
                      </a>


                      {article.credibility_notes && (

                        <p className="mt-2 text-xs text-slate-500">
                          Initial assessment: {article.credibility_notes}
                        </p>

                      )}

                    </div>


                    <div className="flex shrink-0 gap-2 md:flex-col">

                      <button
                        onClick={() => edit(article)}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        Edit
                      </button>


                      <button
                        onClick={() => void remove(article)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>


        <p className="mt-5 text-xs leading-5 text-slate-500">
          Initial credibility is a preliminary source-selection
          judgement. It is not a verified fact-checking verdict.
        </p>

      </div>


      <style jsx>{`

        .field {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-weight: 400;
          outline: none;
        }

        .field:focus {
          border-color: #3b82f6;
        }

      `}</style>

    </main>

  );

}