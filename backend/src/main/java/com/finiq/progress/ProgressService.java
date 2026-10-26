package com.finiq.progress;

import com.finiq.common.*;
import com.finiq.prediction.MlClient;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgressService {
  private final Db db;
  private final MlClient ml;

  public ProgressService(Db db, MlClient ml) {
    this.db = db;
    this.ml = ml;
  }

  public Map<String, Object> progress(long uid, int days) {
    days = Math.max(7, Math.min(365, days));
    Map<String, Object> data = new LinkedHashMap<>();
    long total = db.count("select count(*) from lessons where not deleted");
    long completed =
        db.count(
            "select count(*) from lesson_progress p join lessons l on l.id=p.lesson_id where"
                + " user_id=? and completed and not l.deleted",
            uid);
    data.put("totalLessons", total);
    data.put("completed", completed);
    data.put(
        "completedLessonIds",
        db.jdbc.queryForList(
            "select lesson_id from lesson_progress where user_id=? and completed",
            Long.class,
            uid));
    data.put("percentage", total == 0 ? 0 : Math.round(100.0 * completed / total));
    data.put(
        "knowledgeLevel",
        db.one("select knowledge_level from users where id=?", uid).get("knowledge_level"));
    data.put(
        "averageScore",
        db.jdbc.queryForObject(
            "select coalesce(round(avg(score)::numeric,1),0) from assessment_attempts where"
                + " user_id=?",
            Double.class,
            uid));
    data.put(
        "attemptCount", db.count("select count(*) from assessment_attempts where user_id=?", uid));
    var active =
        db.jdbc.queryForList(
            "select distinct (created_at at time zone 'Asia/Kolkata')::date as day from"
                + " engagement_logs where user_id=? order by day desc",
            uid);
    Set<LocalDate> dates = new HashSet<>();
    for (var d : active) dates.add(((java.sql.Date) d.get("day")).toLocalDate());
    LocalDate date = LocalDate.now(ZoneId.of("Asia/Kolkata"));
    if (!dates.contains(date)) date = date.minusDays(1);
    int streak = 0;
    while (dates.contains(date)) {
      streak++;
      date = date.minusDays(1);
    }
    data.put("streak", streak);
    data.put(
        "activity",
        db.jdbc.queryForList(
            "select to_char(day,'Mon DD') as date, count(e.id) as activities from"
                + " generate_series(current_date - (? - 1),current_date,'1 day') day left join"
                + " engagement_logs e on (e.created_at at time zone 'Asia/Kolkata')::date=day::date"
                + " and e.user_id=? group by day order by day",
            days,
            uid));
    data.put(
        "recentLessons",
        db.jdbc.queryForList(
            "select l.id,l.title,l.description,l.duration,l.difficulty,t.name as"
                + " topic,p.completed,p.last_accessed from lesson_progress p join lessons l on"
                + " l.id=p.lesson_id join topics t on t.id=l.topic_id where p.user_id=? and not"
                + " l.deleted order by p.last_accessed desc limit 5",
            uid));
    data.put(
        "recentSchemes",
        db.jdbc.queryForList(
            "select s.id,s.title,max(e.created_at) as viewed_at from engagement_logs e join"
                + " government_schemes s on s.id=e.scheme_id where e.user_id=? and not s.deleted"
                + " group by s.id,s.title order by viewed_at desc limit 5",
            uid));
    data.put(
        "attempts",
        db.jdbc.queryForList(
            "select a.id,a.score,a.classification,a.created_at,s.title from assessment_attempts a"
                + " join assessments s on s.id=a.assessment_id where user_id=? and"
                + " a.created_at>now()-make_interval(days=>?) order by a.created_at desc",
            uid,
            days));
    data.put(
        "topics",
        db.jdbc.queryForList(
            "select t.name,round(100.0*sum(case when r.correct then 1 else 0 end)/count(*),1) as"
                + " score from assessment_responses r join assessment_attempts a on"
                + " a.id=r.attempt_id join assessment_questions q on q.id=r.question_id join topics"
                + " t on t.id=q.topic_id where a.user_id=? and"
                + " a.created_at>now()-make_interval(days=>?) group by t.name order by t.name",
            uid,
            days));
    data.put(
        "weeklyGoal", db.count("select weekly_goal from learner_profiles where user_id=?", uid));
    data.put(
        "weeklyCompleted",
        db.count(
            "select count(*) from lesson_progress where user_id=? and completed and"
                + " completed_at>=date_trunc('week',now())",
            uid));
    if (streak >= 3)
      db.jdbc.update(
          "insert into user_achievements(user_id,code,title) values(?,'THREE_DAY_STREAK','Three-day"
              + " learning streak') on conflict(user_id,code) do nothing",
          uid);
    var achievements =
        db.jdbc.queryForList(
            "select title,awarded_at from user_achievements where user_id=? order by awarded_at",
            uid);
    data.put("achievements", achievements.stream().map(a -> a.get("title")).toList());
    data.put("achievementHistory", achievements);
    return data;
  }

  @Transactional
  @SuppressWarnings("unchecked")
  public Object recommend(long uid) {
    var user = db.one("select knowledge_level from users where id=?", uid);
    var lessons =
        db.jdbc.queryForList(
            "select l.id,l.title,t.name as topic,l.difficulty,l.description,l.duration from lessons"
                + " l join topics t on t.id=l.topic_id where not l.deleted and not exists(select 1"
                + " from lesson_progress p where p.lesson_id=l.id and p.user_id=? and p.completed)"
                + " order by l.id limit 500",
            uid);
    var weak =
        db.jdbc.queryForList(
            "select distinct t.name from assessment_responses r join assessment_attempts a on"
                + " a.id=r.attempt_id join assessment_questions q on q.id=r.question_id join topics"
                + " t on t.id=q.topic_id where a.user_id=? and not r.correct and a.id=(select"
                + " max(id) from assessment_attempts where user_id=?)",
            String.class,
            uid,
            uid);
    String preferences =
        (String)
            db.one("select preferences from learner_profiles where user_id=?", uid)
                .get("preferences");
    Map<String, Object> response;
    try {
      response =
          ml.call(
              "/recommend",
              Map.of(
                  "level",
                  user.get("knowledge_level"),
                  "weak_topics",
                  weak,
                  "preferences",
                  preferences,
                  "lessons",
                  lessons));
    } catch (Exception e) {
      List<Map<String, Object>> items = new ArrayList<>();
      lessons.stream()
          .sorted(
              Comparator.comparingInt(
                      (Map<String, Object> l) ->
                          (weak.contains(l.get("topic")) ? 3 : 0)
                              + (Objects.equals(l.get("difficulty"), user.get("knowledge_level"))
                                      || Objects.equals(user.get("knowledge_level"), "Unassessed")
                                          && Objects.equals(l.get("difficulty"), "Beginner")
                                  ? 2
                                  : 0)
                              + (preferences
                                      .toLowerCase()
                                      .contains(l.get("topic").toString().toLowerCase())
                                  ? 1
                                  : 0))
                  .reversed())
          .limit(4)
          .forEach(
              l ->
                  items.add(
                      Map.of(
                          "lessonId",
                          l.get("id"),
                          "reason",
                          "Suggested by topic and difficulty baseline")));
      response = Map.of("items", items, "method", "content-rules-java-fallback-v1");
    }
    List<Map<String, Object>> results = new ArrayList<>();
    db.jdbc.update("delete from learner_recommendations where user_id=?", uid);
    for (var item : (List<Map<String, Object>>) response.get("items")) {
      long id = ((Number) item.get("lessonId")).longValue();
      var lesson = lessons.stream().filter(l -> Db.id(l, "id") == id).findFirst().orElse(null);
      if (lesson != null) {
        var enriched = new LinkedHashMap<>(lesson);
        enriched.put("reason", item.get("reason"));
        results.add(enriched);
        db.jdbc.update(
            "insert into learner_recommendations(user_id,lesson_id,reason,method) values(?,?,?,?)",
            uid,
            id,
            item.get("reason"),
            response.get("method"));
      }
    }
    return Map.of("items", results, "method", response.get("method"));
  }
}
