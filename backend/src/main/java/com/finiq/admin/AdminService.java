package com.finiq.admin;

import com.finiq.common.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {
  public record Resource(
      String table, List<String> fields, String search, boolean soft, boolean create) {}

  public static final Map<String, Resource> RESOURCES = new LinkedHashMap<>();

  static {
    RESOURCES.put(
        "lessons",
        new Resource(
            "lessons",
            List.of(
                "title",
                "description",
                "topic_id",
                "difficulty",
                "duration",
                "objectives",
                "content",
                "example",
                "takeaways",
                "source_url"),
            "title",
            true,
            true));
    RESOURCES.put(
        "topics", new Resource("topics", List.of("name", "description"), "name", true, true));
    RESOURCES.put(
        "schemes",
        new Resource(
            "government_schemes",
            List.of(
                "title",
                "category",
                "region",
                "beneficiaries",
                "summary",
                "eligibility",
                "benefits",
                "documents",
                "procedure",
                "faq",
                "source_url",
                "verification"),
            "title",
            true,
            true));
    RESOURCES.put(
        "documents",
        new Resource(
            "policy_documents",
            List.of("scheme_id", "title", "content", "source_url", "language"),
            "title",
            true,
            true));
    RESOURCES.put(
        "institutions",
        new Resource("institutions", List.of("name", "region"), "name", true, true));
    RESOURCES.put(
        "memberships",
        new Resource(
            "institution_memberships", List.of("institution_id", "user_id"), "id", false, true));
    RESOURCES.put(
        "assessments",
        new Resource("assessments", List.of("title", "lesson_id"), "title", true, true));
    RESOURCES.put(
        "questions",
        new Resource(
            "assessment_questions",
            List.of("assessment_id", "topic_id", "prompt", "explanation", "position"),
            "prompt",
            false,
            true));
    RESOURCES.put(
        "options",
        new Resource(
            "assessment_options",
            List.of("question_id", "label", "correct"),
            "label",
            false,
            true));
    RESOURCES.put(
        "users", new Resource("users", List.of("role", "enabled"), "email", false, false));
    RESOURCES.put(
        "contacts", new Resource("contact_submissions", List.of("status"), "email", false, false));
    RESOURCES.put("audit", new Resource("audit_logs", List.of(), "action", false, false));
  }

  private final Db db;

  public AdminService(Db db) {
    this.db = db;
  }

  private Resource resource(String name) {
    var r = RESOURCES.get(name);
    if (r == null) throw new ApiException(404, "Unknown resource.");
    return r;
  }

  public Object metadata() {
    return RESOURCES;
  }

  public Object list(String name, String query, int page, int size, String sort) {
    var r = resource(name);
    size = Db.size(size);
    page = Db.page(page);
    String columns =
        name.equals("users") ? "id,name,email,role,enabled,region,occupation,created_at" : "*";
    String where = " where " + r.search() + "::text ilike ?" + (r.soft() ? " and not deleted" : "");
    String ordering = sort.equals("name") ? r.search() + " asc" : "id desc";
    return Map.of(
        "items",
        db.jdbc.queryForList(
            "select "
                + columns
                + " from "
                + r.table()
                + where
                + " order by "
                + ordering
                + " limit ? offset ?",
            "%" + query + "%",
            size,
            page * size),
        "total",
        db.count("select count(*) from " + r.table() + where, "%" + query + "%"),
        "page",
        page,
        "size",
        size);
  }

  private void frozen(String name, Long id, Map<String, Object> data) {
    if (!List.of("questions", "options").contains(name)) return;
    Object assessment;
    if (name.equals("questions")) {
      assessment =
          id == null
              ? data.get("assessment_id")
              : db.one("select assessment_id from assessment_questions where id=?", id)
                  .get("assessment_id");
    } else {
      Object question =
          id == null
              ? data.get("question_id")
              : db.one("select question_id from assessment_options where id=?", id)
                  .get("question_id");
      assessment =
          db.one("select assessment_id from assessment_questions where id=?", question)
              .get("assessment_id");
    }
    db.one("select id from assessments where id=? for update", assessment);
    if (id != null && (data.containsKey("assessment_id") || data.containsKey("question_id"))) {
      Object target =
          name.equals("questions")
              ? data.get("assessment_id")
              : db.one(
                      "select assessment_id from assessment_questions where id=?",
                      data.get("question_id"))
                  .get("assessment_id");
      if (target != null && !target.toString().equals(assessment.toString())) {
        db.one("select id from assessments where id=? for update", target);
        if (db.count("select count(*) from assessment_attempts where assessment_id=?", target) > 0)
          throw new ApiException(
              409, "Cannot move questions or options into an assessment with attempts.");
      }
    }
    if (db.count("select count(*) from assessment_attempts where assessment_id=?", assessment) > 0)
      throw new ApiException(
          409,
          "This assessment has attempts. Create a new assessment version to preserve history.");
  }

  @Transactional
  public Object save(long actor, String name, Long id, Map<String, Object> data) {
    var r = resource(name);
    if (r.fields().isEmpty() || id == null && !r.create())
      throw new ApiException(405, "This operation is unavailable.");
    if (!r.fields().containsAll(data.keySet()) || data.isEmpty())
      throw new ApiException(400, "Unexpected or missing fields.");
    if (id == null && !data.keySet().containsAll(r.fields()))
      throw new ApiException(400, "Complete all fields; optional IDs can be null.");
    frozen(name, id, data);
    Map<String, Object> clean = new LinkedHashMap<>();
    for (var entry : data.entrySet()) {
      String key = entry.getKey();
      Object value = entry.getValue();
      if (key.endsWith("_id") || key.equals("duration") || key.equals("position")) {
        if (value != null) {
          long number = Long.parseLong(value.toString());
          if (number < 0 || (!key.equals("position") && number == 0))
            throw new ApiException(400, "IDs and duration must be positive.");
          value = number;
        }
      } else if (key.equals("enabled") || key.equals("correct")) {
        if (!(value instanceof Boolean)) throw new ApiException(400, "Boolean value required.");
      } else {
        if (!(value instanceof String s)
            || s.length() > 20000
            || s.isBlank() && !List.of("source_url", "description", "region").contains(key))
          throw new ApiException(400, "Enter valid text for " + key);
        if ((key.equals("title") || key.equals("name")) && s.length() > 120)
          throw new ApiException(400, "Title or name is too long.");
        if (key.equals("source_url") && !s.isBlank() && !s.matches("https://[^\\s]+"))
          throw new ApiException(400, "Source URLs must use HTTPS.");
        if (key.equals("role")
            && !List.of("LEARNER", "INSTITUTION_ADMIN", "PLATFORM_ADMIN").contains(s))
          throw new ApiException(400, "Unknown role.");
        if (key.equals("difficulty")
            && !List.of("Beginner", "Intermediate", "Advanced").contains(s))
          throw new ApiException(400, "Unknown difficulty.");
        if (key.equals("language") && !List.of("en", "hi").contains(s))
          throw new ApiException(400, "Unknown language.");
        if (key.equals("status") && !List.of("New", "In progress", "Resolved").contains(s))
          throw new ApiException(400, "Unknown contact status.");
      }
      clean.put(key, value);
    }
    if (name.equals("users")) {
      if (id == actor)
        throw new ApiException(409, "Use another administrator to change your own role or access.");
      db.jdbc.queryForList("select id from users where role='PLATFORM_ADMIN' for update");
      var target = db.one("select role from users where id=?", id);
      if (target.get("role").equals("PLATFORM_ADMIN")
          && (Boolean.FALSE.equals(clean.get("enabled"))
              || clean.containsKey("role") && !clean.get("role").equals("PLATFORM_ADMIN"))
          && db.count("select count(*) from users where role='PLATFORM_ADMIN' and enabled") <= 1)
        throw new ApiException(409, "At least one enabled administrator is required.");
    }
    List<Object> args = new ArrayList<>(clean.values());
    long saved;
    if (id == null) {
      String fields = String.join(",", clean.keySet());
      String marks = String.join(",", Collections.nCopies(clean.size(), "?"));
      saved =
          db.jdbc.queryForObject(
              "insert into " + r.table() + "(" + fields + ") values(" + marks + ") returning id",
              Long.class,
              args.toArray());
    } else {
      String sets = String.join(",", clean.keySet().stream().map(k -> k + "=?").toList());
      if (name.equals("users")) sets += ",token_version=token_version+1";
      if (List.of("lessons", "schemes").contains(name)) sets += ",updated_at=now()";
      args.add(id);
      if (db.jdbc.update("update " + r.table() + " set " + sets + " where id=?", args.toArray())
          == 0) throw new ApiException(404, "Record not found.");
      saved = id;
    }
    audit(actor, id == null ? "CREATE" : "UPDATE", name, saved);
    return Map.of("id", saved, "message", "Changes saved.");
  }

  @Transactional
  public Object delete(long actor, String name, long id) {
    var r = resource(name);
    if (name.equals("assessments") && id == 1)
      throw new ApiException(409, "The onboarding assessment cannot be archived.");
    if (!r.create()) throw new ApiException(405, "This record cannot be deleted.");
    frozen(name, id, Map.of());
    if (name.equals("topics")
        && db.count("select count(*) from lessons where topic_id=? and not deleted", id) > 0)
      throw new ApiException(409, "Move or archive the topic’s lessons first.");
    if (name.equals("institutions")
        && db.count("select count(*) from institution_memberships where institution_id=?", id) > 0)
      throw new ApiException(409, "Remove institution memberships first.");
    int changed =
        db.jdbc.update(
            r.soft()
                ? "update " + r.table() + " set deleted=true where id=?"
                : "delete from " + r.table() + " where id=?",
            id);
    if (changed == 0) throw new ApiException(404, "Record not found.");
    audit(actor, "DELETE", name, id);
    return Map.of("message", r.soft() ? "Record archived." : "Record deleted.");
  }

  public void audit(long actor, String action, String resource, long id) {
    db.jdbc.update(
        "insert into audit_logs(actor_id,action,resource,resource_id) values(?,?,?,?)",
        actor,
        action,
        resource,
        id);
  }
}
