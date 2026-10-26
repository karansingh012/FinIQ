package com.finiq.analytics;

import com.finiq.common.*;
import com.finiq.prediction.MlClient;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {
  private final Db db;
  private final MlClient ml;

  public AnalyticsService(Db db, MlClient ml) {
    this.db = db;
    this.ml = ml;
  }

  private String scope(long actor) {
    String role = db.one("select role from users where id=?", actor).get("role").toString();
    if (role.equals("PLATFORM_ADMIN")) return "select id from users where role='LEARNER'";
    if (!role.equals("INSTITUTION_ADMIN"))
      throw new ApiException(403, "Administrator access required.");
    return "select distinct m.user_id from institution_memberships m join users u on u.id=m.user_id"
        + " where u.role='LEARNER' and m.institution_id in (select institution_id from"
        + " institution_memberships where user_id="
        + actor
        + ")";
  }

  public Object overview(long actor, int days) {
    days = Math.max(7, Math.min(365, days));
    String ids = scope(actor);
    String filter = "user_id in (" + ids + ")";
    Map<String, Object> result = new LinkedHashMap<>();
    long learners = db.count("select count(*) from (" + ids + ") scoped");
    result.put("learners", learners);
    result.put(
        "activeLearners",
        db.count(
            "select count(distinct user_id) from engagement_logs where "
                + filter
                + " and created_at>now()-make_interval(days=>?)",
            days));
    result.put(
        "completions",
        db.count(
            "select count(*) from lesson_progress where "
                + filter
                + " and completed and completed_at>now()-make_interval(days=>?)",
            days));
    result.put(
        "averageScore",
        db.jdbc.queryForObject(
            "select coalesce(round(avg(score)::numeric,1),0) from assessment_attempts where "
                + filter
                + " and created_at>now()-make_interval(days=>?)",
            Double.class,
            days));
    result.put(
        "completionRate",
        learners == 0
            ? 0
            : 100.0
                * db.count(
                    "select count(*) from lesson_progress p join lessons l on l.id=p.lesson_id"
                        + " where "
                        + filter
                        + " and completed and not l.deleted")
                / Math.max(
                    1, learners * db.count("select count(*) from lessons where not deleted")));
    result.put(
        "engagement",
        db.jdbc.queryForList(
            "select to_char(created_at,'YYYY-MM-DD') as date,count(*) as activities from"
                + " engagement_logs where "
                + filter
                + " and created_at>now()-make_interval(days=>?) group by 1 order by 1",
            days));
    result.put(
        "regions",
        db.jdbc.queryForList(
            "select region as name,count(*) as learners from users where id in ("
                + ids
                + ") group by region order by learners desc"));
    result.put(
        "occupations",
        db.jdbc.queryForList(
            "select occupation as name,count(*) as learners from users where id in ("
                + ids
                + ") group by occupation order by learners desc"));
    result.put(
        "topics",
        db.jdbc.queryForList(
            "select t.name,count(*) as activities from engagement_logs e join lessons l on"
                + " l.id=e.lesson_id join topics t on t.id=l.topic_id where e."
                + filter
                + " and e.created_at>now()-make_interval(days=>?) group by t.name",
            days));
    result.put(
        "risks",
        db.jdbc.queryForList(
            "select distinct on(user_id) user_id,risk_score,category,method,created_at from"
                + " disengagement_predictions where "
                + filter
                + " order by user_id,created_at desc"));
    result.put(
        "scope",
        db.one("select role from users where id=?", actor).get("role").equals("PLATFORM_ADMIN")
            ? "All platform learners"
            : "Learners in your assigned institutions");
    return result;
  }

  public Object refreshRisk(long actor) {
    String ids = scope(actor);
    var users =
        db.jdbc.queryForList(
            "select id,created_at from users where id in (" + ids + ") order by id limit 500");
    for (var u : users) {
      long uid = Db.id(u, "id");
      int days =
          db.jdbc.queryForObject(
              "select least(36500,greatest(0,extract(day from"
                  + " now()-coalesce(max(created_at),?))))::int from engagement_logs where"
                  + " user_id=?",
              Integer.class,
              u.get("created_at"),
              uid);
      long active =
          db.count(
              "select count(distinct created_at::date) from engagement_logs where user_id=? and"
                  + " created_at>current_date-13",
              uid);
      long started =
          db.count(
              "select count(*) from lesson_progress where user_id=? and"
                  + " last_accessed>now()-interval '14 days'",
              uid);
      long complete =
          db.count(
              "select count(*) from lesson_progress where user_id=? and completed_at>now()-interval"
                  + " '14 days'",
              uid);
      long quiz =
          db.count(
              "select count(*) from assessment_attempts where user_id=? and"
                  + " created_at>now()-interval '14 days'",
              uid);
      double rate = started == 0 ? 0 : Math.min(1, 1.0 * complete / started),
          participation = Math.min(1, quiz / 3.0);
      Map<String, Object> prediction;
      try {
        prediction =
            ml.call(
                "/risk",
                Map.of(
                    "days_since_activity",
                    days,
                    "completion_rate",
                    rate,
                    "quiz_participation",
                    participation,
                    "active_days_14",
                    Math.min(14, active)));
      } catch (Exception e) {
        double score =
            Math.round(
                    1000
                        * (.45 * Math.min(days / 14.0, 1)
                            + .25 * (1 - rate)
                            + .15 * (1 - participation)
                            + .15 * (1 - Math.min(active, 14) / 14.0)))
                / 10.0;
        prediction =
            Map.of(
                "score",
                score,
                "category",
                score >= 65 ? "High" : score >= 35 ? "Medium" : "Low",
                "method",
                "engagement-heuristic-v1-java-fallback");
      }
      db.jdbc.update(
          "insert into disengagement_predictions(user_id,risk_score,category,method)"
              + " values(?,?,?,?)",
          uid,
          prediction.get("score"),
          prediction.get("category"),
          prediction.get("method"));
    }
    db.jdbc.update(
        "insert into audit_logs(actor_id,action,resource) values(?,'SCORE_RISK','learners')",
        actor);
    return Map.of("message", "Support indicators refreshed.", "scored", users.size(), "limit", 500);
  }
}
