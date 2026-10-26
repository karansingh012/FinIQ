import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useApp, useApi } from "../lib/context";
import { api, errorMessage } from "../lib/api";
import {
  Heading,
  State,
  Button,
  Field,
  Modal,
  Pager,
  Empty,
  Badge,
} from "../components/ui";
import { ActivityChart, TopicChart } from "../components/Charts";
export function Institution() {
  const { t, notify } = useApp();
  const [days, setDays] = useState(30),
    [busy, setBusy] = useState(false);
  const r = useApi(`/institution/analytics?days=${days}`);
  async function refresh() {
    setBusy(true);
    try {
      await api.post("/institution/risk");
      r.reload();
      notify("Support indicators refreshed.");
    } catch (e) {
      notify(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="LEARNING, SEEN TOGETHER"
        title={t("Learning overview")}
        description="Understand participation. Find opportunities to support your learners."
        action={
          <select
            aria-label="Date range"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          >
            {[14, 30, 90].map((d) => (
              <option key={d} value={d}>
                {t(`Last ${d} days`)}
              </option>
            ))}
          </select>
        }
      />
      <State resource={r}>
        {(d) => (
          <>
            <div className="info-banner">
              {d.scope}. No learners outside this scope are included.
            </div>
            <div className="stats-grid">
              {[
                ["Registered learners", d.learners],
                ["Active learners", d.activeLearners],
                ["Lessons completed", d.completions],
                ["Average quiz score", `${Math.round(d.averageScore)}%`],
              ].map(([label, value]) => (
                <div className="stat-card" key={label}>
                  <span>{t(label)}</span>
                  <strong>{value}</strong>
                  <small>Selected period · persisted data</small>
                </div>
              ))}
            </div>
            <div className="grid-two">
              <div className="card chart-card">
                <h2>Engagement trend</h2>
                <ActivityChart data={d.engagement} />
              </div>
              <div className="card chart-card">
                <h2>Topic engagement</h2>
                <TopicChart data={d.topics} value="activities" />
              </div>
            </div>
            <div className="grid-two mt-6">
              {[
                ["Participation by region", d.regions],
                ["Participation by occupation", d.occupations],
              ].map(([title, rows]) => (
                <div className="card form-card" key={title}>
                  <h2>{title}</h2>
                  {rows.length ? (
                    rows.map((row) => (
                      <div className="data-row" key={row.name}>
                        <span>{row.name || "Not specified"}</span>
                        <strong>{row.learners}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="muted">No learners in this scope.</p>
                  )}
                </div>
              ))}
            </div>
            <div className="card table-card mt-6">
              <div className="section-heading-row">
                <div>
                  <h2>{t("Support indicators")}</h2>
                  <p className="muted text-sm">
                    Heuristic baseline, not a validated prediction. Use only to
                    offer learning support.
                  </p>
                </div>
                <Button variant="secondary small" busy={busy} onClick={refresh}>
                  {t("Refresh indicators")}
                </Button>
              </div>
              {d.risks.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Learner ID</th>
                        <th>Score</th>
                        <th>Indicator</th>
                        <th>Method</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.risks.map((r) => (
                        <tr key={r.user_id}>
                          <td>#{r.user_id}</td>
                          <td>{r.risk_score}</td>
                          <td>
                            <Badge
                              tone={r.category === "High" ? "amber" : "teal"}
                            >
                              {r.category}
                            </Badge>
                          </td>
                          <td>{r.method}</td>
                          <td>{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="No indicators yet"
                  message="Refresh indicators to calculate documented baseline scores for your learners."
                />
              )}
              <p className="method-note">
                All-time lesson completion rate: {d.completionRate.toFixed(1)}%.
                Scoring is capped at 500 learners per refresh in this academic
                build.
              </p>
            </div>
          </>
        )}
      </State>
    </>
  );
}
const labels = {
  lessons: "Lessons",
  topics: "Topics",
  schemes: "Government schemes",
  documents: "Policy documents",
  institutions: "Institutions",
  memberships: "Memberships",
  assessments: "Assessments",
  questions: "Questions",
  options: "Answer options",
  users: "Users & roles",
  contacts: "Contact submissions",
  audit: "Audit log",
};
const choices = {
  role: ["LEARNER", "INSTITUTION_ADMIN", "PLATFORM_ADMIN"],
  difficulty: ["Beginner", "Intermediate", "Advanced"],
  language: ["en", "hi"],
  status: ["New", "In progress", "Resolved"],
};
function Editor({ resource, definition, row, onClose, onSaved }) {
  const { t, notify } = useApp();
  const [values, setValues] = useState(
      Object.fromEntries(
        definition.fields.map((f) => [
          f,
          row?.[f] ??
            (f === "enabled"
              ? true
              : f === "correct"
                ? false
                : choices[f]?.[0] || ""),
        ]),
      ),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function change(f, v) {
    setValues({ ...values, [f]: v });
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = { ...values };
    for (const f of definition.fields) {
      if (f.endsWith("_id") || ["duration", "position"].includes(f))
        body[f] = values[f] === "" ? null : Number(values[f]);
    }
    try {
      if (row) await api.put(`/admin/resources/${resource}/${row.id}`, body);
      else await api.post(`/admin/resources/${resource}`, body);
      notify("Changes saved.");
      onSaved();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${t(row ? "Edit" : "Create")} · ${labels[resource]}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        <div className="editor-fields">
          {definition.fields.map((f) => (
            <Field key={f} label={f.replaceAll("_", " ")}>
              {["enabled", "correct"].includes(f) ? (
                <select
                  value={String(values[f])}
                  onChange={(e) => change(f, e.target.value === "true")}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : choices[f] ? (
                <select
                  value={values[f]}
                  onChange={(e) => change(f, e.target.value)}
                >
                  {choices[f].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : [
                  "description",
                  "content",
                  "objectives",
                  "example",
                  "takeaways",
                  "summary",
                  "eligibility",
                  "benefits",
                  "documents",
                  "procedure",
                  "faq",
                  "prompt",
                  "explanation",
                ].includes(f) ? (
                <textarea
                  rows={3}
                  required={f !== "description"}
                  value={values[f]}
                  maxLength={20000}
                  onChange={(e) => change(f, e.target.value)}
                />
              ) : (
                <input
                  type={
                    f.endsWith("_id") || ["duration", "position"].includes(f)
                      ? "number"
                      : f === "source_url"
                        ? "url"
                        : "text"
                  }
                  min={f === "position" ? 0 : 1}
                  required={
                    ![
                      "source_url",
                      "region",
                      "lesson_id",
                      "scheme_id",
                    ].includes(f)
                  }
                  value={values[f]}
                  onChange={(e) => change(f, e.target.value)}
                />
              )}
            </Field>
          ))}
        </div>
        <p className="method-note">
          Use semicolons between lesson objectives and takeaways. Related IDs
          refer to records in the corresponding management tab. Leave optional
          lesson/scheme IDs blank.
        </p>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button busy={busy}>{t("Save changes")}</Button>
        </div>
      </form>
    </Modal>
  );
}
export default function Admin() {
  const { t, notify } = useApp();
  const [type, setType] = useState("lessons"),
    [page, setPage] = useState(0),
    [q, setQ] = useState(""),
    [sort, setSort] = useState("recent"),
    [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null),
    [busy, setBusy] = useState(false);
  const meta = useApi("/admin/metadata"),
    r = useApi(
      `/admin/resources/${type}?${new URLSearchParams({ page, q, sort })}`,
    );
  const def = meta.data?.[type];
  async function remove() {
    setBusy(true);
    try {
      await api.delete(`/admin/resources/${type}/${deleting.id}`);
      setDeleting(null);
      r.reload();
      notify("Record removed from active catalogue.");
    } catch (e) {
      notify(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  }
  function tab(v) {
    setType(v);
    setPage(0);
    setQ("");
  }
  return (
    <>
      <Heading
        eyebrow="PLATFORM WORKSPACE"
        title={t("Administration")}
        description="Keep educational content useful, accurate and accountable."
      />
      <div className="admin-tabs">
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            className={type === key ? "active" : ""}
            onClick={() => tab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label={t("Search records")}
            placeholder={t("Search records")}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <select
          aria-label="Sort records"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recent">{t("Newest first")}</option>
          <option value="name">{t("Name")}</option>
        </select>
        {def?.create && (
          <Button onClick={() => setEditing({ row: null })}>
            <Plus size={16} />
            {t("Create")}
          </Button>
        )}
      </div>
      {type === "questions" || type === "options" ? (
        <div className="info-banner">
          Assessments with submitted attempts are locked against question
          changes. Create a new version to preserve the meaning of historical
          results. Each question must have exactly one correct option before
          learners can use it.
        </div>
      ) : null}
      <State resource={r}>
        {(d) =>
          d.items.length ? (
            <div className="card table-card">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(d.items[0])
                        .filter(
                          (k) =>
                            ![
                              "content",
                              "objectives",
                              "example",
                              "takeaways",
                              "summary",
                              "eligibility",
                              "benefits",
                              "documents",
                              "procedure",
                              "faq",
                              "description",
                              "password_hash",
                              "token_version",
                            ].includes(k),
                        )
                        .slice(0, 7)
                        .map((k) => (
                          <th key={k}>{k.replaceAll("_", " ")}</th>
                        ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((row) => (
                      <tr key={row.id}>
                        {Object.keys(d.items[0])
                          .filter(
                            (k) =>
                              ![
                                "content",
                                "objectives",
                                "example",
                                "takeaways",
                                "summary",
                                "eligibility",
                                "benefits",
                                "documents",
                                "procedure",
                                "faq",
                                "description",
                                "password_hash",
                                "token_version",
                              ].includes(k),
                          )
                          .slice(0, 7)
                          .map((k) => (
                            <td key={k}>
                              <span
                                title={String(row[k] ?? "")}
                                className="truncate-cell"
                              >
                                {String(row[k] ?? "—")}
                              </span>
                            </td>
                          ))}
                        <td>
                          <div className="flex gap-2">
                            {def?.fields.length > 0 && (
                              <button
                                className="icon-button"
                                aria-label={`Edit ${row.id}`}
                                onClick={() => setEditing({ row })}
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            {def?.create && (
                              <button
                                className="icon-button danger"
                                aria-label={`Delete ${row.id}`}
                                onClick={() => setDeleting(row)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            {!def?.fields.length && (
                              <span className="muted">Read only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager data={d} page={page} setPage={setPage} />
            </div>
          ) : (
            <Empty />
          )
        }
      </State>
      {editing && (
        <Editor
          resource={type}
          definition={def}
          row={editing.row}
          onClose={() => setEditing(null)}
          onSaved={r.reload}
        />
      )}{" "}
      {deleting && (
        <Modal title="Remove this record?" onClose={() => setDeleting(null)}>
          <p>
            Remove{" "}
            <strong>
              {deleting.title || deleting.name || `record #${deleting.id}`}
            </strong>
            ? Content is archived where supported. Related records may prevent
            removal.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              {t("Cancel")}
            </Button>
            <Button variant="danger" busy={busy} onClick={remove}>
              {t("Confirm")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
