import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp, useApi } from "../lib/context";
import { Heading, State, Empty, Badge } from "../components/ui";
import { Stats } from "./Dashboard";
import { ActivityChart, TopicChart } from "../components/Charts";
export default function Progress() {
  const { t , locale } = useApp();
  const [days, setDays] = useState(30);
  const resource = useApi(`/progress?days=${days}`);
  return (
    <>
      <Heading
        eyebrow={t("LOOK HOW FAR YOU’VE COME")}
        title={t("My progress")}
        description={t("Every lesson and every question adds up.")}
        action={
          <select
            aria-label={t("Date range")}
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
                <h2>{t("Overall completion")}</h2>
                <strong>{t(d.percentage)}%</strong>
              </div>
              <div className="progress-track">
                <div
                  style={{
                    width: `${d.percentage}%`,
                  }}
                />
              </div>
              <p className="muted mt-3">
                {t(d.completed)} {t("of")} {t(d.totalLessons)}{" "}
                {t(
                  "lessons completed. Time spent is not estimated from page-open duration.",
                )}
              </p>
            </div>
            <div className="card table-card mt-6">
              <h2>{t("Assessment history")}</h2>
              {d.attempts.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("Assessment")}</th>
                        <th>{t("Date")}</th>
                        <th>{t("Score")}</th>
                        <th>{t("Level")}</th>
                        <th>{t("Review")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.attempts.map((a) => (
                        <tr key={a.id}>
                          <td>{t(a.title)}</td>
                          <td>
                            {t(
                              new Date(a.created_at).toLocaleDateString(
                                locale,
                              ),
                            )}
                          </td>
                          <td>{t(Math.round(a.score))}%</td>
                          <td>
                            <Badge>{t(a.classification)}</Badge>
                          </td>
                          <td>
                            <Link className="text-link" to={`/results/${a.id}`}>
                              {t("View results \u2192")}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title={t("No activity yet")}
                  message={t("Your progress will appear as you learn.")}
                />
              )}
            </div>
            <div className="grid-two mt-6">
              <div className="card form-card">
                <h2>{t("Achievements")}</h2>
                {d.achievements.length ? (
                  (d.achievementHistory || []).map((a) => (
                    <p key={a.title}>
                      ✦ {t(a.title)}
                      <small className="block muted">
                        {t(
                          new Date(a.awarded_at).toLocaleDateString(
                            locale,
                          ),
                        )}
                      </small>
                    </p>
                  ))
                ) : (
                  <p className="muted">
                    {t("Complete a lesson to earn your first milestone.")}
                  </p>
                )}
              </div>
              <div className="card form-card">
                <h2>{t("Recently viewed schemes")}</h2>
                {d.recentSchemes.length ? (
                  d.recentSchemes.map((s) => (
                    <p key={s.id}>
                      <Link className="text-link" to={`/schemes/${s.id}`}>
                        {t(s.title)} →
                      </Link>
                    </p>
                  ))
                ) : (
                  <p className="muted">
                    {t("Explore a scheme to start your history.")}
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
