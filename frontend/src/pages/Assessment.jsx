import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Check, ArrowRight, RotateCcw } from "lucide-react";
import { useApp, useApi } from "../lib/context";
import { api, errorMessage } from "../lib/api";
import { State, Heading, Button, Badge } from "../components/ui";
export default function Assessment() {
  const { id = "1" } = useParams();
  const resource = useApi(`/assessments/${id}`);
  const { t, notify, setUser } = useApp();
  const [answers, setAnswers] = useState({}),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setAnswers({});
    setStep(0);
  }, [id]);
  async function submit() {
    setBusy(true);
    try {
      const result = (await api.post(`/assessments/${id}/submit`, { answers }))
        .data;
      const me = (await api.get("/me")).data;
      setUser(me.user);
      navigate(`/results/${result.id}`);
    } catch (e) {
      notify(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="assessment-page">
      <Heading
        eyebrow="A MOMENT TO CHECK IN"
        title={t("Knowledge check")}
        description="This is a starting point, not a judgement. Choose the answer that feels right to you."
      />
      <State resource={resource}>
        {(data) => {
          if (!data.questions.length)
            return (
              <div className="empty">This assessment has no questions yet.</div>
            );
          const question = data.questions[step];
          return (
            <div className="quiz-layout">
              <div className="card quiz-card">
                <div className="quiz-top">
                  <Badge>{question.topic}</Badge>
                  <span>
                    Question {step + 1} of {data.questions.length}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    style={{
                      width: `${((step + 1) / data.questions.length) * 100}%`,
                    }}
                  />
                </div>
                <h2>{question.prompt}</h2>
                <fieldset>
                  <legend className="sr-only">Choose one answer</legend>
                  {question.options.map((option, i) => (
                    <label
                      key={option.id}
                      className={`answer-option ${answers[question.id] === option.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={answers[question.id] === option.id}
                        onChange={() =>
                          setAnswers({ ...answers, [question.id]: option.id })
                        }
                      />
                      <span className="option-letter">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{option.label}</span>
                      {answers[question.id] === option.id && (
                        <Check size={18} />
                      )}
                    </label>
                  ))}
                </fieldset>
                <div className="quiz-actions">
                  <Button
                    variant="secondary"
                    disabled={step === 0}
                    onClick={() => setStep(step - 1)}
                  >
                    {t("Previous")}
                  </Button>
                  {step < data.questions.length - 1 ? (
                    <Button
                      disabled={!answers[question.id]}
                      onClick={() => setStep(step + 1)}
                    >
                      {t("Next")} <ArrowRight size={17} />
                    </Button>
                  ) : (
                    <Button
                      busy={busy}
                      disabled={
                        Object.keys(answers).length !== data.questions.length
                      }
                      onClick={submit}
                    >
                      {t("Submit answers")}
                    </Button>
                  )}
                </div>
              </div>
              <aside className="card quiz-aside">
                <span className="eyebrow">YOUR STARTING POINT</span>
                <h3>{data.title}</h3>
                <p>
                  Answers are scored securely after submission. You can review
                  every answer and explanation afterward.
                </p>
                <div className="question-dots">
                  {data.questions.map((q, i) => (
                    <button
                      key={q.id}
                      aria-label={`Question ${i + 1}`}
                      className={answers[q.id] ? "answered" : ""}
                      onClick={() => setStep(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <small>
                  Classification uses a documented score baseline. It is not a
                  validated prediction of financial ability.
                </small>
              </aside>
            </div>
          );
        }}
      </State>
    </div>
  );
}
export function Results() {
  const { id } = useParams();
  const resource = useApi(`/attempts/${id}`);
  const { t } = useApp();
  return (
    <div>
      <Heading
        title={t("Your results")}
        description="A clearer picture of what you know — and where to go next."
      />
      <State resource={resource}>
        {(d) => (
          <>
            <div className="result-banner">
              <div className="score-circle">
                {Math.round(d.score)}
                <small>/ 100</small>
              </div>
              <div>
                <Badge>{t(d.classification)}</Badge>
                <h2>{d.title}</h2>
                <p>Scoring method: {d.method}</p>
                <Link to="/dashboard" className="button">
                  {t("Recommended for you")} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <h2 className="section-heading">{t("Review your answers")}</h2>
            <div className="review-list">
              {d.responses.map((r, i) => (
                <div className="card review-card" key={i}>
                  <Badge tone={r.correct ? "teal" : "amber"}>
                    {r.correct ? "Strength" : "Practice this topic"} · {r.topic}
                  </Badge>
                  <h3>{r.prompt}</h3>
                  <p>
                    {t("Your answer")}: {r.selected}
                  </p>
                  {!r.correct && (
                    <p>
                      <strong>
                        {t("Correct answer")}: {r.answer}
                      </strong>
                    </p>
                  )}
                  <div className="explanation">{r.explanation}</div>
                </div>
              ))}
            </div>
            <Link to="/assessment" className="button secondary mt-6">
              <RotateCcw size={16} />
              {t("Take assessment")}
            </Link>
          </>
        )}
      </State>
    </div>
  );
}
