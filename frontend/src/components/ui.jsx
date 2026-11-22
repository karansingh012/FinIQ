import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Clock,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useApp } from "../lib/context";
export function Logo() {
  const { t } = useApp();
  return (
    <Link to="/" className="logo" aria-label={t("FinIQ home")}>
      <span className="logo-mark">
        <svg viewBox="0 0 40 40" fill="none">
          <path
            d="M20 5C26 5 32 8.5 32 14.5C32 23 23 31.5 20 34C17 31.5 8 23 8 14.5C8 8.5 14 5 20 5Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M15 13h11m-11 5h10m-9-5c10 0 10 10 1 10l8 8"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </span>
      <span>
        Fin<span className="text-indigo">IQ</span>
        <small>{t("LEARN. UNDERSTAND. GROW.")}</small>
      </span>
    </Link>
  );
}
export function Button({
  children,
  variant = "",
  className = "",
  busy = false,
  ...props
}) {
  const { t } = useApp();
  return (
    <button
      className={`button ${variant} ${className}`}
      disabled={busy || props.disabled}
      {...props}
    >
      {t(busy ? t("Working…") : children)}
    </button>
  );
}
export function Badge({ children, tone = "" }) {
  const { t } = useApp();
  return <span className={`badge ${tone}`}>{t(children)}</span>;
}
export function Heading({ eyebrow, title, description, action }) {
  const { t } = useApp();
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{t(eyebrow)}</div>}
        <h1>{t(title)}</h1>
        {description && <p>{t(description)}</p>}
      </div>
      {t(action)}
    </div>
  );
}
export function Empty({
  title = "No results yet",
  message = "Try changing your filters.",
  action,
}) {
  const { t } = useApp();
  return (
    <div className="empty">
      <Search size={28} />
      <h3>{t(title)}</h3>
      <p>{t(message)}</p>
      {t(action)}
    </div>
  );
}
export function State({ resource, children }) {
  const { t } = useApp();
  if (resource.loading)
    return (
      <div className="skeleton-group" aria-label={t("Loading")} role="status">
        <div className="skeleton h-24" />
        <div className="grid-cards">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton h-48" />
          ))}
        </div>
      </div>
    );
  if (resource.error)
    return (
      <div className="empty error" role="alert">
        <h3>{t(resource.error)}</h3>
        <Button onClick={resource.reload}>{t("Try again")}</Button>
      </div>
    );
  return children(resource.data);
}
export function LessonCard({ lesson, reason }) {
  const { t } = useApp();
  return (
    <article className="resource-card">
      <div className={`lesson-art art-${lesson.id % 4}`}>
        <BookOpen size={29} />
        <span>{t(String(lesson.id).padStart(2, "0"))}</span>
      </div>
      <div className="resource-body">
        <div className="flex justify-between gap-2">
          <span className="eyebrow">{t(lesson.topic)}</span>
          <Badge>{t(lesson.difficulty)}</Badge>
        </div>
        <h3>
          <Link to={`/lessons/${lesson.id}`}>{t(lesson.title)}</Link>
        </h3>
        <p>{t(lesson.description)}</p>
        {reason && <div className="reason">✦ {t(reason)}</div>}
        <div className="card-footer">
          <span>
            <Clock size={14} /> {t(lesson.duration)} {t("min")}
          </span>
          <Link to={`/lessons/${lesson.id}`} className="text-link">
            {t("Read lesson")} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function SchemeCard({ scheme }) {
  const { t } = useApp();
  return (
    <article className="resource-card scheme-card">
      <div className="resource-body">
        <div className="flex justify-between">
          <span className="icon-tile teal">
            <ShieldCheck size={24} />
          </span>
          <Badge>{t(scheme.category)}</Badge>
        </div>
        <h3>
          <Link to={`/schemes/${scheme.id}`}>{t(scheme.title)}</Link>
        </h3>
        <p>{t(scheme.summary)}</p>
        <div className="meta-line">
          {t(scheme.region)} · {t(scheme.beneficiaries)}
        </div>
        <div className="verification">
          {t("Demonstration catalogue \xB7 verify current rules")}
        </div>
        <Link className="text-link" to={`/schemes/${scheme.id}`}>
          {t("View scheme")} <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
export function Pager({ data, page, setPage }) {
  const { t } = useApp();
  return (
    data.total > data.size && (
      <div className="pager">
        <Button
          variant="secondary"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          {t("Previous")}
        </Button>
        <span>
          {t(page + 1)} / {t(Math.ceil(data.total / data.size))}
        </span>
        <Button
          variant="secondary"
          disabled={(page + 1) * data.size >= data.total}
          onClick={() => setPage(page + 1)}
        >
          {t("Next")}
        </Button>
      </div>
    )
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef();
  const { t } = useApp();
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="modal"
    >
      <div className="modal-head">
        <h2>{t(title)}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t("Close")}
        >
          <X />
        </button>
      </div>
      {t(children)}
    </dialog>
  );
}
export function Field({ label, error, children }) {
  const { t } = useApp();
  return (
    <label className="field">
      <span>{t(label)}</span>
      {t(children)}
      {error && (
        <small role="alert" className="field-error">
          {t(error)}
        </small>
      )}
    </label>
  );
}
