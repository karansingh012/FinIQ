import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Flame,
  Target,
  ChartNoAxesCombined,
  ArrowUpRight,
  Check,
  Landmark,
  Sparkles,
  Award,
} from "lucide-react";
import { useApp, useApi } from "../lib/context";
import { Heading, State, Badge, LessonCard, Empty } from "../components/ui";
import { ActivityChart } from "../components/Charts";
export function Stats({ data }) {
  const { t } = useApp();
  return (
    <div className="stats-grid">
      {[
        [
          BookOpen,
          "Lessons completed",
          data.completed,
          `of ${data.totalLessons} in the library`,
        ],
        [
          Target,
          "Knowledge level",
          t(data.knowledgeLevel),
          "Your assessment starting point",
        ],
        [
          ChartNoAxesCombined,
          "Average quiz score",
          data.attemptCount ? `${Math.round(data.averageScore)}%` : "—",
          `${data.attemptCount} knowledge checks completed`,
        ],
        [
          Flame,
          "Learning streak",
          `${data.streak} ${t("days")}`,
          "A little progress, every day",
        ],
      ].map(([Icon, label, value, sub], i) => (
        <div className="stat-card" key={label}>
          <div className="stat-top">
            <span>{t(label)}</span>
            <span className={`stat-icon color-${i}`}>
              <Icon size={18} />
            </span>
          </div>
          <strong>{value}</strong>
          <small>{sub}</small>
        </div>
      ))}
    </div>
  );
}
export default function Dashboard() {
  const { t, user } = useApp();
  const progress = useApi("/progress"),
    recommendations = useApi("/recommendations");
  return (
    <>
      <Heading
        eyebrow="YOUR PERSONAL LEARNING SPACE"
        title={`${t("Welcome back")}, ${user?.name.split(" ")[0]}.`}
        description={t("A little learning. A lot more confidence.")}
        action={
          <Link to="/progress" className="button secondary small">
            {t("View progress")} <ArrowUpRight size={16} />
          </Link>
        }
      />
      <State resource={progress}>
        {(d) => (
          <>
            <div className="welcome-banner">
              <div>
                <Badge tone="dark">
                  <Sparkles size={13} /> YOUR JOURNEY, YOUR PACE
                </Badge>
                <h2>
                  {d.knowledgeLevel === "Unassessed"
                    ? t("Need a starting point?")
                    : t("Your next chapter starts here.")}
                </h2>
                <p>
                  {t(
                    "Check your knowledge and build a learning path around you.",
                  )}
                </p>
                <Link
                  to={
                    d.knowledgeLevel === "Unassessed" ? "/assessment" : "/learn"
                  }
                  className="button light"
                >
                  {t(
                    d.knowledgeLevel === "Unassessed"
                      ? "Take assessment"
                      : "Continue learning",
                  )}{" "}
                  <ArrowRight size={16} />
                </Link>
              </div>
              <div className="banner-orbit">
                <div className="banner-orbit-inner">
                  <BookOpen size={38} />
                  <span>
                    Make it
                    <br />
                    <strong>make sense.</strong>
                  </span>
                </div>
                <span className="orbit-spark">✦</span>
              </div>
            </div>
            <Stats data={d} />
            <div className="dashboard-columns">
              <section>
                <div className="section-heading-row">
                  <div>
                    <div className="eyebrow">YOUR NEXT SMALL STEP</div>
                    <h2>{t("Recommended for you")}</h2>
                  </div>
                  <Link className="text-link" to="/learn">
                    {t("View all")} <ArrowRight size={16} />
                  </Link>
                </div>
                <State resource={recommendations}>
                  {(r) => (
                    <>
                      {r.items.length ? (
                        <div className="recommend-grid">
                          {r.items.slice(0, 2).map((l) => (
                            <LessonCard
                              key={l.id}
                              lesson={l}
                              reason={l.reason}
                            />
                          ))}
                        </div>
                      ) : (
                        <Empty
                          title="All available lessons completed"
                          message="Revisit the library or take another knowledge check."
                        />
                      )}
                      <p className="method-note">
                        Personalized with transparent baseline rules ·{" "}
                        {r.method}
                      </p>
                    </>
                  )}
                </State>
                <div className="card activity-card">
                  <div className="section-heading-row">
                    <h2>{t("Learning activity")}</h2>
                    <span className="muted text-xs">{t("Last 14 days")}</span>
                  </div>
                  <ActivityChart data={d.activity} />
                </div>
                {d.recentLessons.length > 0 && (
                  <div className="card continue-card">
                    <h2>{t("Continue learning")}</h2>
                    {d.recentLessons.map((l) => (
                      <Link
                        className="continue-row"
                        key={l.id}
                        to={`/lessons/${l.id}`}
                      >
                        <span className="icon-tile small">
                          <BookOpen size={18} />
                        </span>
                        <div>
                          <strong>{l.title}</strong>
                          <small>
                            {l.topic} · {l.duration} min
                          </small>
                        </div>
                        {l.completed ? (
                          <Check size={18} className="text-teal" />
                        ) : (
                          <ArrowRight size={17} />
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </section>
              <aside className="dashboard-aside">
                <div className="card goal-card">
                  <div className="flex justify-between">
                    <h3>{t("Your weekly goal")}</h3>
                    <Target size={20} className="text-indigo" />
                  </div>
                  <div className="goal-count">
                    {d.weeklyCompleted}
                    <span>
                      {" "}
                      / {d.weeklyGoal} {t("lessons")}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      style={{
                        width: `${Math.min(100, (d.weeklyCompleted / d.weeklyGoal) * 100)}%`,
                      }}
                    />
                  </div>
                  <p>
                    {d.weeklyCompleted >= d.weeklyGoal
                      ? "You’ve reached your weekly learning goal."
                      : "One lesson is a good place to begin. You’ve got this."}
                  </p>
                  <Link to="/settings" className="text-link">
                    Adjust your goal <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="scheme-callout">
                  <Landmark size={25} />
                  <div className="eyebrow">THE POLICY NAVIGATOR</div>
                  <h3>
                    More awareness.
                    <br />
                    More possibility.
                  </h3>
                  <p>
                    Explore government programmes and find official information
                    in one place.
                  </p>
                  <Link className="text-link" to="/explore">
                    {t("Explore schemes")} <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="card achievements">
                  <h3>{t("Achievements")}</h3>
                  {d.achievements.length ? (
                    d.achievements.map((a) => (
                      <div key={a}>
                        <Award size={20} />
                        <span>{a}</span>
                      </div>
                    ))
                  ) : (
                    <p>Your first milestone starts with your first lesson.</p>
                  )}
                </div>
                <div className="daily-note">
                  <span>GOOD TO REMEMBER</span>
                  <p>
                    Financial confidence is a skill.
                    <br />
                    You build it, one question at a time.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </State>
    </>
  );
}
