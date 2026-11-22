import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ExternalLink,
  Clock,
  Volume2,
} from "lucide-react";
import { useApp, useApi } from "../lib/context";
import { api, errorMessage } from "../lib/api";
import { State, Badge, Button } from "../components/ui";
export default function Detail({ scheme = false }) {
  const { id } = useParams();
  const { t, user, notify, lang } = useApp();
  const base = scheme ? "schemes" : "lessons";
  const resource = useApi(`/${base}/${id}`);
  const [saved, setSaved] = useState(false),
    [complete, setComplete] = useState(false),
    [busy, setBusy] = useState(false),
    [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    setSaved(false);
    setComplete(false);
    if (user) {
      api
        .get("/bookmarks")
        .then((r) => setSaved(r.data[base].some((x) => x.id === Number(id))))
        .catch(() => {});
      if (!scheme)
        api
          .get("/progress")
          .then((r) =>
            setComplete(r.data.completedLessonIds.includes(Number(id))),
          )
          .catch(() => {});
      api
        .post(`/${base}/${id}/visit`)
        .catch((e) => notify(errorMessage(e), "error"));
    }
    return () => window.speechSynthesis?.cancel();
  }, [id, base, user?.id]);
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [lang]);
  async function bookmark() {
    setBusy(true);
    try {
      await api[saved ? "delete" : "put"](`/${base}/${id}/bookmark`);
      setSaved(!saved);
    } catch (e) {
      notify(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    setBusy(true);
    try {
      await api.post(`/lessons/${id}/complete`);
      setComplete(true);
      notify("Lesson completed.");
    } catch (e) {
      notify(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  }
  function listen(text) {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(t(text));
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      notify("Speech is not available in this browser.", "error");
    };
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }
  return (
    <div className="detail-page">
      <Link
        className="back-link"
        to={user ? (scheme ? "/explore" : "/learn") : `/${base}`}
      >
        <ArrowLeft size={17} />
        {t(scheme ? "Government schemes" : "Back to learning")}
      </Link>
      <State resource={resource}>
        {(d) => (
          <>
            <div className="detail-heading">
              <div className="eyebrow">{t(scheme ? d.category : d.topic)}</div>
              <h1>{t(d.title)}</h1>
              <p>{t(scheme ? d.summary : d.description)}</p>
              <div className="detail-meta">
                <Badge>{t(scheme ? d.region : t(d.difficulty))}</Badge>
                {!scheme && (
                  <span>
                    <Clock size={16} /> {t(d.duration)} {t("min read")}
                  </span>
                )}
                {user ? (
                  <Button
                    variant="secondary small"
                    busy={busy}
                    onClick={bookmark}
                  >
                    <Bookmark
                      size={16}
                      fill={saved ? "currentColor" : "none"}
                    />
                    {t(saved ? "Saved" : "Save")}
                  </Button>
                ) : (
                  <Link to="/login" className="text-link">
                    {t("Sign in to save")}
                  </Link>
                )}
                {!scheme && "speechSynthesis" in window && (
                  <Button
                    variant="ghost small"
                    onClick={() => listen(d.content)}
                  >
                    <Volume2 size={16} />
                    {t(speaking ? "Stop" : "Listen")}
                  </Button>
                )}
              </div>
            </div>
            <div className="detail-grid">
              <article className="article card">
                {t(
                  scheme ? (
                    <>
                      <div className="info-banner">
                        {t(d.verification)}{" "}
                        {t(
                          ". This is an educational summary, not an official eligibility decision.",
                        )}
                      </div>
                      {[
                        ["Eligibility", d.eligibility],
                        ["Benefits", d.benefits],
                        ["Documents", d.documents],
                        ["How to apply", d.procedure],
                        ["FAQ", d.faq],
                      ].map(([title, text]) => (
                        <section key={title}>
                          <h2>{t(title)}</h2>
                          <p>{t(text)}</p>
                        </section>
                      ))}
                      <a
                        className="button"
                        href={d.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("Official source")} <ExternalLink size={16} />
                      </a>
                    </>
                  ) : (
                    <>
                      <div className="objectives">
                        <h2>{t("Learning objectives")}</h2>
                        <ul>
                          {d.objectives.split(";").map((v) => (
                            <li key={v}>
                              <Check size={16} />
                              {t(v)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {d.content.split("\n\n").map((text, i) => (
                        <p key={i}>{t(text)}</p>
                      ))}
                      <div className="example-box">
                        <span className="eyebrow">
                          {t("PUT IT INTO PERSPECTIVE")}
                        </span>
                        <h2>{t("Try this example")}</h2>
                        <p>{t(d.example)}</p>
                      </div>
                      <h2>{t("Key takeaways")}</h2>
                      <ul className="takeaways">
                        {d.takeaways.split(";").map((v) => (
                          <li key={v}>{t(v)}</li>
                        ))}
                      </ul>
                      {d.source_url && (
                        <a
                          className="text-link"
                          href={d.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t("Official source")} <ExternalLink size={14} />
                        </a>
                      )}
                      <div className="lesson-actions">
                        {user ? (
                          <>
                            <Button
                              busy={busy}
                              disabled={complete}
                              onClick={finish}
                            >
                              <Check size={17} />
                              {t(complete ? "Completed" : "Mark complete")}
                            </Button>
                            {d.assessmentId > 0 && (
                              <Link
                                to={`/assessment/${d.assessmentId}`}
                                className="button secondary"
                              >
                                {t("Take quiz")}
                              </Link>
                            )}
                          </>
                        ) : (
                          <Link className="button" to="/register">
                            {t("Create an account to track progress")}
                          </Link>
                        )}
                      </div>
                    </>
                  ),
                )}
              </article>
              <aside>
                <div className="card side-card">
                  <span className="eyebrow">{t("KEEP EXPLORING")}</span>
                  <h3>{t("Related resources")}</h3>
                  {d.related.length ? (
                    d.related.map((r) => (
                      <Link key={r.id} to={`/${base}/${r.id}`}>
                        {t(r.title)} <span>→</span>
                      </Link>
                    ))
                  ) : (
                    <p>{t("Explore another topic in the library.")}</p>
                  )}
                  <Link to={user ? "/ask" : "/login"}>
                    {t("Ask FinIQ")} <span>→</span>
                  </Link>
                </div>
                <div className="reading-note">
                  {t("Take your time. You can always return to this resource.")}
                </div>
              </aside>
            </div>
          </>
        )}
      </State>
    </div>
  );
}
