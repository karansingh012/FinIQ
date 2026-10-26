package com.finiq.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finiq.common.*;
import com.finiq.prediction.MlClient;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class SearchService {
  public record Question(
      @NotBlank @Size(min = 2, max = 1000) String question,
      @NotNull @Pattern(regexp = "en|hi") String language) {}

  private final Db db;
  private final MlClient ml;
  private final ObjectMapper mapper;

  public SearchService(Db db, MlClient ml, ObjectMapper mapper) {
    this.db = db;
    this.ml = ml;
    this.mapper = mapper;
  }

  @SuppressWarnings("unchecked")
  public Object ask(long uid, Question r) {
    List<Map<String, Object>> docs = new ArrayList<>();
    for (var s :
        db.jdbc.queryForList(
            "select * from government_schemes where not deleted order by id limit 400"))
      docs.add(
          Map.of(
              "id",
              "scheme-" + s.get("id"),
              "title",
              s.get("title"),
              "content",
              s.get("summary") + " " + s.get("eligibility") + " " + s.get("documents"),
              "url",
              s.get("source_url")));
    for (var l :
        db.jdbc.queryForList("select * from lessons where not deleted order by id limit 400"))
      docs.add(
          Map.of(
              "id",
              "lesson-" + l.get("id"),
              "title",
              l.get("title"),
              "content",
              l.get("content"),
              "url",
              "/lessons/" + l.get("id")));
    for (var d :
        db.jdbc.queryForList(
            "select * from policy_documents where not deleted order by id limit 200"))
      docs.add(
          Map.of(
              "id",
              "document-" + d.get("id"),
              "title",
              d.get("title"),
              "content",
              d.get("content"),
              "url",
              d.get("source_url")));
    Map<String, Object> result;
    try {
      result =
          ml.call(
              "/retrieve",
              Map.of("query", r.question(), "language", r.language(), "documents", docs));
    } catch (Exception e) {
      var tokens =
          Arrays.stream(r.question().toLowerCase().split("\\W+"))
              .filter(s -> s.length() > 2)
              .toList();
      List<Map<String, Object>> found = new ArrayList<>();
      for (var d : docs) {
        String text = (d.get("title") + " " + d.get("content")).toLowerCase();
        if (tokens.stream().anyMatch(text::contains)) {
          found.add(
              Map.of(
                  "id",
                  d.get("id"),
                  "title",
                  d.get("title"),
                  "excerpt",
                  d.get("content")
                      .toString()
                      .substring(0, Math.min(650, d.get("content").toString().length())),
                  "url",
                  d.get("url")));
          if (found.size() == 3) break;
        }
      }
      result = Map.of("sources", found, "method", "keyword-java-fallback-v1");
    }
    var sources = (List<Map<String, Object>>) result.get("sources");
    String answer =
        sources.isEmpty()
            ? (r.language().equals("hi")
                ? "विश्वसनीय मेल नहीं मिला। योजना का नाम या कोई विषय लिखें।"
                : "I could not find a reliable match. Try a scheme name or a specific learning"
                    + " topic.")
            : (r.language().equals("hi")
                ? "संबंधित स्रोत नीचे दिए गए हैं। मूल नीति का अर्थ सुरक्षित रखने के लिए उद्धरण मूल"
                    + " भाषा में हैं। यह पात्रता का निर्णय नहीं है।"
                : "Here are the closest source passages. These are retrieved educational excerpts,"
                    + " not an eligibility decision or a generated official answer.");
    String json;
    try {
      json = mapper.writeValueAsString(sources);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
    db.jdbc.update("insert into search_history(user_id,query) values(?,?)", uid, r.question());
    db.jdbc.update(
        "insert into conversation_history(user_id,question,answer,sources,language)"
            + " values(?,?,?,?,?)",
        uid,
        r.question(),
        answer,
        json,
        r.language());
    return Map.of("answer", answer, "sources", sources, "method", result.get("method"));
  }

  public Object history(long uid) {
    var rows =
        db.jdbc.queryForList(
            "select * from conversation_history where user_id=? order by created_at desc limit 30",
            uid);
    for (var r : rows)
      try {
        r.put("sources", mapper.readValue(r.get("sources").toString(), List.class));
      } catch (Exception e) {
        r.put("sources", List.of());
      }
    return rows;
  }
}
