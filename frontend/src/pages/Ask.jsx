import React, { useState } from "react";
import { MessageSquare, ArrowUpRight, Send, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp, useApi } from "../lib/context";
import { api, errorMessage } from "../lib/api";
import { Heading, Button, State, Badge, Empty } from "../components/ui";
function Source({ source }) {
  const { t , locale } = useApp();
  const internal = source.url.startsWith("/");
  return (
    <div className="source-card">
      <div className="flex gap-2 items-center">
        <BookOpen size={16} />
        {internal ? (
          <Link to={source.url}>{t(source.title)} ↗</Link>
        ) : (
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {t(source.title)} ↗
          </a>
        )}
      </div>
      <p>{t(source.excerpt)}</p>
    </div>
  );
}
export default function Ask() {
  const { t, lang, notify , locale } = useApp();
  const history = useApi("/search/history");
  const [question, setQuestion] = useState(""),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState(null);
  async function ask(e) {
    e.preventDefault();
    if (question.trim().length < 2) return;
    setBusy(true);
    try {
      const response = (
        await api.post("/search", {
          question: question.trim(),
          language: lang,
        })
      ).data;
      setResult({
        ...response,
        question,
      });
      setQuestion("");
      history.reload();
    } catch (e) {
      notify(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ask-page">
      <Heading
        eyebrow={t("CURIOSITY IS A GOOD START")}
        title={t("Ask FinIQ")}
        description={t(
          "Find clear explanations in your learning library and policy sources.",
        )}
      />
      <div className="ask-intro">
        <span className="icon-tile">
          <MessageSquare size={28} />
        </span>
        <h2>{t("What would you like to understand?")}</h2>
        <p>
          {t(
            "Search in English or Hindi. FinIQ retrieves relevant source passages without inventing an answer.",
          )}
        </p>
        <div className="suggested-questions">
          {[
            "What is the difference between PPF and NPS?",
            "How does insurance work?",
            "Tell me about savings and pensions",
          ].map((q) => (
            <button key={q} onClick={() => setQuestion(t(q))}>
              {t(q)} <ArrowUpRight size={14} />
            </button>
          ))}
        </div>
      </div>
      <form
        onInvalid={(e) =>
          e.target.setCustomValidity(t("Please check this field."))
        }
        onInput={(e) => e.target.setCustomValidity?.("")}
        className="ask-input"
        onSubmit={ask}
      >
        <label className="sr-only" htmlFor="question">
          {t("Ask a question")}
        </label>
        <textarea
          id="question"
          rows={2}
          minLength={2}
          maxLength={1000}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("Ask a question")}
          required
        />
        <Button busy={busy} disabled={question.trim().length < 2}>
          <Send size={17} />
          {t("Ask")}
        </Button>
      </form>
      <p className="method-note">
        {t(
          "Lexical retrieval baseline \xB7 No paid AI provider \xB7 Source excerpts are not an official eligibility decision.",
        )}
      </p>
      {result && (
        <section className="card answer-card" aria-live="polite">
          <Badge>{t("Retrieved sources")}</Badge>
          <h3>{t(result.question)}</h3>
          <p>
            {t(
              result.sources.length
                ? "Here are the closest source passages. These are retrieved educational excerpts, not an eligibility decision or a generated official answer."
                : "I could not find a reliable match. Try a scheme name or a specific learning topic.",
            )}
          </p>
          <div className="sources">
            {result.sources.map((s) => (
              <Source key={s.id} source={s} />
            ))}
          </div>
          <small className="muted">{t(result.method)}</small>
        </section>
      )}
      <h2 className="section-heading mt-8">{t("Conversation history")}</h2>
      <State resource={history}>
        {(d) =>
          d.length ? (
            <div className="history-list">
              {d.map((h) => (
                <details className="card" key={h.id}>
                  <summary>
                    {t(h.question)}
                    <small>
                      {t(
                        new Date(h.created_at).toLocaleDateString(
                          locale,
                        ),
                      )}
                    </small>
                  </summary>
                  <p>
                    {t(
                      h.sources.length
                        ? "Here are the closest source passages. These are retrieved educational excerpts, not an eligibility decision or a generated official answer."
                        : "I could not find a reliable match. Try a scheme name or a specific learning topic.",
                    )}
                  </p>
                  {h.sources.map((s) => (
                    <Source key={s.id} source={s} />
                  ))}
                </details>
              ))}
            </div>
          ) : (
            <Empty
              title={t("No results yet")}
              message={t(
                "Your questions and retrieved sources will appear here.",
              )}
            />
          )
        }
      </State>
    </div>
  );
}
