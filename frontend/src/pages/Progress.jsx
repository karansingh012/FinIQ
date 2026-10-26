import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp, useApi } from "../lib/context";
import { Heading, State, Empty, Badge } from "../components/ui";
import { Stats } from "./Dashboard";
import { ActivityChart, TopicChart } from "../components/Charts";
export default function Progress() {
  const { t } = useApp();
  const [days, setDays] = useState(30);
  const resource = useApi(`/progress?days=${days}`);
  return (
    <>
      <Heading
        eyebrow="LOOK HOW FAR YOU’VE COME"
        title={t("My progress")}
        description="Every lesson and every question adds up."
        action={
          <select
            aria-label="Date range"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          >
            {[14, 30, 90].map((n) => (
              <option key={n} value={n}>
                {t(`Last ${n} days`)}
              </option>
            ))}
          </select>
        }
      />
      <State resource={resource}>
        {(d) => (
          <>
            <Stats data={d} />
            <div className="grid-two">
              <div className="card chart-card">
                <h2>{t("Learning activity")}</h2>
                <ActivityChart data={d.activity} />
              </div>
              <div className="card chart-card">
                <h2>{t("Topic performance")}</h2>
                <TopicChart data={d.topics} />
              </div>
            </div>
            <div className="card form-card mt-6">
              <div className="section-heading-row">
                <h2>Overall completion</h2>
                <strong>{d.percentage}%</strong>
              </div>
              <div className="progress-track">
                <div style={{ width: `${d.percentage}%` }} />
              </div>
              <p className="muted mt-3">
                {d.completed} of {d.totalLessons} lessons completed. Time spent
                is not estimated from page-open duration.
              </p>
            </div>
            <div className="card table-card mt-6">
              <h2>{t("Assessment history")}</h2>
              {d.attempts.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Assessment</th>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Level</th>
                        <th>Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.attempts.map((a) => (
                        <tr key={a.id}>
                          <td>{a.title}</td>
                          <td>{new Date(a.created_at).toLocaleDateString()}</td>
                          <td>{Math.round(a.score)}%</td>
                          <td>
                            <Badge>{t(a.classification)}</Badge>
                          </td>
                          <td>
                            <Link className="text-link" to={`/results/${a.id}`}>
                              View results →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="No activity yet"
                  message="Your progress will appear as you learn."
                />
              )}
            </div>
            <div className="grid-two mt-6">
              <div className="card form-card">
                <h2>{t("Achievements")}</h2>
                {d.achievements.length ? (
                  (d.achievementHistory || []).map((a) => <p key={a.title}>✦ {a.title}<small className="block muted">{new Date(a.awarded_at).toLocaleDateString()}</small></p>)
                ) : (
                  <p className="muted">
                    Complete a lesson to earn your first milestone.
                  </p>
                )}
              </div>
              <div className="card form-card">
                <h2>Recently viewed schemes</h2>
                {d.recentSchemes.length ? (
                  d.recentSchemes.map((s) => (
                    <p key={s.id}>
                      <Link className="text-link" to={`/schemes/${s.id}`}>
                        {s.title} →
                      </Link>
                    </p>
                  ))
                ) : (
                  <p className="muted">
                    Explore a scheme to start your history.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </State>
    </>
  );
}
