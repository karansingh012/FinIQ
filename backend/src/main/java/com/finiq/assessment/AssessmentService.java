package com.finiq.assessment;

import com.finiq.common.*;
import com.finiq.prediction.MlClient;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssessmentService {
  public record Submission(@NotEmpty @Size(max = 100) Map<Long, Long> answers) {}

  private final Db db;
  private final MlClient ml;

  public AssessmentService(Db db, MlClient ml) {
    this.db = db;
    this.ml = ml;
  }

  private void validateQuestions(long id) {
    long invalid =
        db.count(
            "select count(*) from assessment_questions q where q.assessment_id=? and ((select"
                + " count(*) from assessment_options o where o.question_id=q.id)<2 or (select"
                + " count(*) from assessment_options o where o.question_id=q.id and o.correct)<>1)",
            id);
    if (invalid > 0)
      throw new ApiException(409, "This assessment is being prepared. Please try another lesson.");
  }

  public Object get(long id) {
    var a = new LinkedHashMap<>(db.one("select * from assessments where id=? and not deleted", id));
    validateQuestions(id);
    var qs =
        db.jdbc.queryForList(
            "select q.id,q.prompt,t.name as topic from assessment_questions q join topics t on"
                + " t.id=q.topic_id where assessment_id=? order by position,id",
            id);
    for (var q : qs)
      q.put(
          "options",
          db.jdbc.queryForList(
              "select id,label from assessment_options where question_id=? order by id",
              q.get("id")));
    a.put("questions", qs);
    return a;
  }

  @Transactional
  public Object submit(long user, long assessment, Submission r) {
    db.one("select id from assessments where id=? and not deleted for update", assessment);
    validateQuestions(assessment);
    var qs =
        db.jdbc.queryForList(
            "select id from assessment_questions where assessment_id=?", assessment);
    if (qs.isEmpty() || qs.size() != r.answers().size())
      throw new ApiException(400, "Answer every question exactly once.");
    int correct = 0;
    List<Map<String, Object>> answers = new ArrayList<>();
    for (var q : qs) {
      long qid = Db.id(q, "id");
      Long option = r.answers().get(qid);
      if (option == null) throw new ApiException(400, "Answer every question.");
      var options =
          db.jdbc.queryForList(
              "select id,correct from assessment_options where question_id=? and id=?",
              qid,
              option);
      if (options.isEmpty())
        throw new ApiException(400, "An answer does not belong to its question.");
      var row = new HashMap<>(options.get(0));
      row.put("question", qid);
      answers.add(row);
      if (Boolean.TRUE.equals(row.get("correct"))) correct++;
    }
    double score = 100.0 * correct / qs.size();
    var classification = ml.classify(score);
    long attempt =
        db.jdbc.queryForObject(
            "insert into assessment_attempts(user_id,assessment_id,score,classification,method)"
                + " values(?,?,?,?,?) returning id",
            Long.class,
            user,
            assessment,
            score,
            classification.get("level"),
            classification.get("method"));
    for (var a : answers)
      db.jdbc.update(
          "insert into assessment_responses(attempt_id,question_id,option_id,correct)"
              + " values(?,?,?,?)",
          attempt,
          a.get("question"),
          a.get("id"),
          a.get("correct"));
    if (assessment == 1)
      db.jdbc.update(
          "update users set knowledge_level=? where id=?", classification.get("level"), user);
    db.jdbc.update("insert into engagement_logs(user_id,action) values(?,'QUIZ')", user);
    db.jdbc.update(
        "insert into user_achievements(user_id,code,title) values(?,'FIRST_QUIZ','First knowledge"
            + " check') on conflict(user_id,code) do nothing",
        user);
    return result(user, attempt);
  }

  public Object result(long user, long id) {
    var row =
        new LinkedHashMap<>(
            db.one(
                "select a.*,s.title from assessment_attempts a join assessments s on"
                    + " s.id=a.assessment_id where a.id=? and a.user_id=?",
                id,
                user));
    row.put(
        "responses",
        db.jdbc.queryForList(
            "select q.prompt,q.explanation,t.name as topic,r.correct,o.label as selected,(select"
                + " string_agg(label,', ') from assessment_options where question_id=q.id and"
                + " correct) as answer from assessment_responses r join assessment_questions q on"
                + " q.id=r.question_id join topics t on t.id=q.topic_id join assessment_options o"
                + " on o.id=r.option_id where r.attempt_id=? order by q.position,q.id",
            id));
    return row;
  }
}
