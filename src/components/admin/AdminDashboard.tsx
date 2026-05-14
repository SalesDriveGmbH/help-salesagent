import { useState } from "react";
import AddKnowledge from "./AddKnowledge";
import FromIntercom from "./FromIntercom";
import PendingReviews from "./PendingReviews";
import Library from "./Library";
import ReviewCard, { type ReviewCardData } from "./ReviewCard";

interface CategoryMeta { slug: string; title: string; description: string; icon: string }
interface ArticleSummary { id: string; title: string; category: string; slug: string; firstParagraph: string; status: string }

type Tab = "add" | "intercom" | "drafts" | "library";

const TABS: Array<{ key: Tab; label: string; hint: string }> = [
  { key: "add", label: "Add Knowledge", hint: "Manuelle Notiz" },
  { key: "intercom", label: "From Intercom", hint: "Aus geschlossenen Tickets" },
  { key: "drafts", label: "Pending Reviews", hint: "Drafts reviewen" },
  { key: "library", label: "Library", hint: "Alle Artikel" },
];

export default function AdminDashboard({ categories, articles }: { categories: CategoryMeta[]; articles: ArticleSummary[] }) {
  const [tab, setTab] = useState<Tab>("add");
  const [activeReview, setActiveReview] = useState<ReviewCardData | null>(null);

  return (
    <div className="space-y-8">
      <nav
        className="flex flex-wrap items-center gap-2 rounded-xl border p-1.5"
        style={{ borderColor: "var(--color-border-subtle)", background: "rgba(14, 14, 14, 0.5)" }}
      >
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setActiveReview(null); }}
              className="rounded-lg px-4 py-2 text-sm transition-colors"
              style={
                active
                  ? { background: "var(--color-gold-primary)", color: "#050505", fontWeight: 500 }
                  : { color: "var(--color-text-secondary)" }
              }
            >
              {t.label}
              <span className="ml-2 hidden text-xs sm:inline" style={{ opacity: 0.6 }}>{t.hint}</span>
            </button>
          );
        })}
      </nav>

      {activeReview && (
        <ReviewCard
          data={activeReview}
          articles={articles}
          onClose={() => setActiveReview(null)}
          onPublished={() => { setActiveReview(null); location.reload(); }}
        />
      )}

      {!activeReview && (
        <>
          {tab === "add" && <AddKnowledge onReview={setActiveReview} />}
          {tab === "intercom" && <FromIntercom onReview={setActiveReview} />}
          {tab === "drafts" && <PendingReviews onReview={setActiveReview} />}
          {tab === "library" && <Library categories={categories} articles={articles} onReview={setActiveReview} />}
        </>
      )}
    </div>
  );
}
