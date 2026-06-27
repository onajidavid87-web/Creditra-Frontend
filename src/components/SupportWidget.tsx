import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HelpCircle, Mail, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import faqEntriesData from "../data/faq.json";
import "./SupportWidget.css";

type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  tags: string[];
};

const SUPPORT_EMAIL = "support@creditra.com";
const faqEntries = faqEntriesData as FaqEntry[];

const searchableValue = (entry: FaqEntry) =>
  [entry.question, entry.answer, ...entry.tags].join(" ").toLowerCase();

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const resultsHeadingId = useId();

  const filteredFaqs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return faqEntries;

    return faqEntries.filter((entry) =>
      searchableValue(entry).includes(normalizedQuery),
    );
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    searchInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!expandedId) return;

    const hasExpandedEntry = filteredFaqs.some(
      (entry) => entry.id === expandedId,
    );
    if (!hasExpandedEntry) {
      setExpandedId(filteredFaqs[0]?.id ?? null);
    }
  }, [expandedId, filteredFaqs]);

  return (
    <div className="support-widget" ref={containerRef}>
      {isOpen && (
        <section
          id={panelId}
          className="support-widget__panel"
          role="dialog"
          aria-modal="false"
          aria-label="Support and FAQ search"
        >
          <div className="support-widget__header">
            <div>
              <h2 className="support-widget__title">Support</h2>
              <p className="support-widget__subtitle">
                Search quick answers or hand off to email support.
              </p>
            </div>
            <button
              type="button"
              className="support-widget__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close support widget"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <label
            className="support-widget__search-label"
            htmlFor={`${panelId}-search`}
          >
            Search FAQ
          </label>
          <input
            id={`${panelId}-search`}
            ref={searchInputRef}
            type="search"
            className="support-widget__search"
            placeholder="Search FAQ topics"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <p className="support-widget__meta" id={resultsHeadingId}>
            {filteredFaqs.length} result{filteredFaqs.length === 1 ? "" : "s"}
          </p>

          {filteredFaqs.length > 0 ? (
            <ul
              className="support-widget__faq-list"
              aria-labelledby={resultsHeadingId}
            >
              {filteredFaqs.map((entry) => {
                const answerId = `${panelId}-${entry.id}-answer`;
                const isExpanded = expandedId === entry.id;

                return (
                  <li key={entry.id} className="support-widget__faq-item">
                    <button
                      type="button"
                      className="support-widget__faq-button"
                      aria-expanded={isExpanded}
                      aria-controls={answerId}
                      onClick={() =>
                        setExpandedId(isExpanded ? null : entry.id)
                      }
                    >
                      <span className="support-widget__faq-question">
                        {entry.question}
                      </span>
                    </button>
                    {isExpanded && (
                      <div id={answerId} className="support-widget__faq-answer">
                        {entry.answer}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="support-widget__empty" role="status">
              No FAQ matched that search. Use email support for account-specific
              help.
            </div>
          )}

          <div className="support-widget__actions">
            <a
              className="support-widget__email-link"
              href={`mailto:${SUPPORT_EMAIL}?subject=GrantFox%20support%20request`}
              aria-label="Email support"
            >
              <Mail size={16} aria-hidden="true" />
              Email support
            </a>
            <Link className="support-widget__help-link" to="/help">
              <Search size={16} aria-hidden="true" />
              Full help center
            </Link>
          </div>
        </section>
      )}

      <button
        type="button"
        className="support-widget__trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <HelpCircle size={18} aria-hidden="true" />
        Support
      </button>
    </div>
  );
}

export default SupportWidget;
