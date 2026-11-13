"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { name: "Dashboard", path: "/", icon: "⌂" },
  { name: "Claims", path: "/claims", icon: "▤" },
  { name: "Evidence", path: "/evidence", icon: "◈" },
  { name: "Reports", path: "/reports", icon: "▥" },
  { name: "Sources", path: "/sources", icon: "◎" },
  { name: "Articles", path: "/articles", icon: "▧" },
  { name: "AI Analysis", path: "/ai-analysis", icon: "✧" },
  { name: "Human Verification", path: "/human-review", icon: "✓" },
  { name: "AI vs Human Comparison", path: "/comparison", icon: "⇄" },
];

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-5 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
            className="rounded-lg border px-3 py-2 text-2xl text-gray-700 hover:bg-gray-100"
          >
            ☰
          </button>

          <Link href="/" className="text-xl font-bold text-blue-700">
            VerityAI
          </Link>
        </div>

        <span className="text-sm text-gray-500">
          AI Verification Hub
        </span>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40"
          onClick={() => setOpen(false)}
        >
          <nav
            className="h-full w-72 max-w-[85%] overflow-y-auto bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-700">
                VerityAI
              </h2>

              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg px-3 py-1 text-2xl hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Main Navigation
            </p>

            <div className="space-y-2">
              {pages.map((page) => (
                <Link
                  key={page.path}
                  href={page.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 font-medium transition ${
                    pathname === page.path
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <span className="text-xl">{page.icon}</span>
                  {page.name}
                </Link>
              ))}
            </div>

            <div className="mt-10 border-t pt-5 text-sm text-gray-400">
              VerityAI — AI Fake News & Verification Hub
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
