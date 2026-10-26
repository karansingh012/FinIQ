package com.finiq.lesson;

import com.finiq.common.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogService {
  private final Db db;

  public CatalogService(Db db) {
    this.db = db;
  }

  public Object schemeFilters() {
    return Map.of(
        "regions",
        db.jdbc.queryForList(
            "select distinct region from government_schemes where not deleted order by region",
            String.class),
        "categories",
        db.jdbc.queryForList(
            "select distinct category from government_schemes where not deleted order by category",
            String.class));
  }

  public Object topics() {
    return db.jdbc.queryForList("select * from topics where not deleted order by name");
  }

  public Map<String, Object> list(
      boolean schemes,
      String query,
      String category,
      String difficulty,
      String region,
      String beneficiary,
      int page,
      int size) {
    page = Db.page(page);
    size = Db.size(size);
    String select =
        schemes
            ? "select s.* from government_schemes s"
            : "select s.*,t.name as topic from lessons s join topics t on t.id=s.topic_id";
    String where =
        " where not s.deleted and (lower(s.title) like ? or lower("
            + (schemes ? "s.summary" : "s.description")
            + ") like ?)";
    List<Object> args =
        new ArrayList<>(List.of("%" + query.toLowerCase() + "%", "%" + query.toLowerCase() + "%"));
    if (!category.isBlank()) {
      where += " and " + (schemes ? "s.category" : "t.name") + "=?";
      args.add(category);
    }
    if (!schemes && !difficulty.isBlank()) {
      where += " and s.difficulty=?";
      args.add(difficulty);
    }
    if (schemes && !region.isBlank()) {
      where += " and s.region=?";
      args.add(region);
    }
    if (schemes && !beneficiary.isBlank()) {
      where += " and lower(s.beneficiaries) like ?";
      args.add("%" + beneficiary.toLowerCase() + "%");
    }
    long total = db.count("select count(*) from (" + select + where + ") x", args.toArray());
    args.add(size);
    args.add(page * size);
    return Map.of(
        "items",
        db.jdbc.queryForList(select + where + " order by s.id limit ? offset ?", args.toArray()),
        "total",
        total,
        "page",
        page,
        "size",
        size);
  }

  public Object detail(boolean schemes, long id) {
    var row =
        db.one(
            schemes
                ? "select * from government_schemes where id=? and not deleted"
                : "select l.*,t.name as topic from lessons l join topics t on t.id=l.topic_id where"
                    + " l.id=? and not l.deleted",
            id);
    var result = new LinkedHashMap<>(row);
    result.put(
        "related",
        db.jdbc.queryForList(
            schemes
                ? "select id,title from government_schemes where category=? and id<>? and not"
                    + " deleted limit 3"
                : "select id,title from lessons where topic_id=? and id<>? and not deleted limit 3",
            row.get(schemes ? "category" : "topic_id"),
            id));
    if (!schemes)
      result.put(
          "assessmentId",
          db.count(
              "select coalesce(min(id),0) from assessments where lesson_id=? and not deleted", id));
    return result;
  }

  @Transactional
  public Object visit(long user, long id, boolean scheme) {
    detail(scheme, id);
    if (!scheme)
      db.jdbc.update(
          "insert into lesson_progress(user_id,lesson_id) values(?,?) on"
              + " conflict(user_id,lesson_id) do update set last_accessed=now()",
          user,
          id);
    db.jdbc.update(
        "insert into engagement_logs(user_id,"
            + (scheme ? "scheme_id" : "lesson_id")
            + ",action) values(?,?,?)",
        user,
        id,
        scheme ? "VIEW_SCHEME" : "VIEW_LESSON");
    return Map.of("message", "Activity saved.");
  }

  @Transactional
  public Object complete(long user, long id) {
    detail(false, id);
    int changed =
        db.jdbc.update(
            "insert into lesson_progress(user_id,lesson_id,completed,completed_at)"
                + " values(?,?,true,now()) on conflict(user_id,lesson_id) do update set"
                + " completed=true,completed_at=coalesce(lesson_progress.completed_at,now()),last_accessed=now()"
                + " where not lesson_progress.completed",
            user,
            id);
    if (changed > 0)
      db.jdbc.update(
          "insert into engagement_logs(user_id,lesson_id,action) values(?,?,'COMPLETE_LESSON')",
          user,
          id);
    long completed =
        db.count("select count(*) from lesson_progress where user_id=? and completed", user);
    if (completed >= 1)
      db.jdbc.update(
          "insert into user_achievements(user_id,code,title) values(?,'FIRST_LESSON','First lesson"
              + " completed') on conflict(user_id,code) do nothing",
          user);
    if (completed >= 5)
      db.jdbc.update(
          "insert into user_achievements(user_id,code,title) values(?,'FIVE_LESSONS','Five lessons"
              + " completed') on conflict(user_id,code) do nothing",
          user);
    return Map.of("message", "Lesson completed.");
  }

  @Transactional
  public Object bookmark(long user, long id, boolean scheme, boolean save) {
    detail(scheme, id);
    String table = scheme ? "scheme_bookmarks" : "lesson_bookmarks",
        column = scheme ? "scheme_id" : "lesson_id";
    if (save)
      db.jdbc.update(
          "insert into " + table + "(user_id," + column + ") values(?,?) on conflict do nothing",
          user,
          id);
    else db.jdbc.update("delete from " + table + " where user_id=? and " + column + "=?", user, id);
    return Map.of("saved", save);
  }

  public Object bookmarks(long user) {
    return Map.of(
        "lessons",
        db.jdbc.queryForList(
            "select l.*,t.name as topic from lesson_bookmarks b join lessons l on l.id=b.lesson_id"
                + " join topics t on t.id=l.topic_id where b.user_id=? and not l.deleted order by"
                + " b.created_at desc",
            user),
        "schemes",
        db.jdbc.queryForList(
            "select s.* from scheme_bookmarks b join government_schemes s on s.id=b.scheme_id where"
                + " b.user_id=? and not s.deleted order by b.created_at desc",
            user));
  }
}
