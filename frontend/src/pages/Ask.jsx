import React, { useState } from "react";
import { MessageSquare, ArrowUpRight, Send, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp, useApi } from "../lib/context";
import { api, errorMessage } from "../lib/api";
import { Heading, Button, State, Badge, Empty } from "../components/ui";
function Source({ source }) {
  const internal = source.url.startsWith("/");
  return (
    <div className="source-card">
      <div className="flex gap-2 items-center">
        <BookOpen size={16} />
        {internal ? (
          <Link to={source.url}>{source.title} ↗</Link>
        ) : (
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.title} ↗
          </a>
        )}
      </div>
      <p>{source.excerpt}</p>
    </div>
  );
}
export default function Ask() {
  const { t, lang, notify } = useApp();
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
        await api.post("/search", { question: question.trim(), language: lang })
      ).data;
      setResult({ ...response, question });
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
        eyebrow="CURIOSITY IS A GOOD START"
        title={t("Ask FinIQ")}
        description="Find clear explanations in your learning library and policy sources."
      />
      <div className="ask-intro">
        <span className="icon-tile">
          <MessageSquare size={28} />
        </span>
        <h2>What would you like to understand?</h2>
        <p>
          Search in English or Hindi. FinIQ retrieves relevant source passages
          without inventing an answer.
        </p>
        <div className="suggested-questions">
          {[
            "What is the difference between PPF and NPS?",
            "How does insurance work?",
            "बचत और पेंशन के बारे में बताएं",
          ].map((q) => (
            <button key={q} onClick={() => setQuestion(q)}>
              {q} <ArrowUpRight size={14} />
            </button>
          ))}
        </div>
      </div>
      <form className="ask-input" onSubmit={ask}>
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
        Lexical retrieval baseline · No paid AI provider · Source excerpts are
        not an official eligibility decision.
      </p>
      {result && (
        <section className="card answer-card" aria-live="polite">
          <Badge>Retrieved sources</Badge>
          <h3>{result.question}</h3>
          <p>{result.answer}</p>
          <div className="sources">
            {result.sources.map((s) => (
              <Source key={s.id} source={s} />
            ))}
          </div>
          <small className="muted">{result.method}</small>
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
                    {h.question}
                    <small>{new Date(h.created_at).toLocaleDateString()}</small>
                  </summary>
                  <p>{h.answer}</p>
                  {h.sources.map((s) => (
                    <Source key={s.id} source={s} />
                  ))}
                </details>
              ))}
            </div>
          ) : (
            <Empty
              title="No results yet"
              message="Your questions and retrieved sources will appear here."
            />
          )
        }
      </State>
    </div>
  );
}
