package com.finiq;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class FullStackApiTest {
  static final String jwtSecret = UUID.randomUUID().toString() + UUID.randomUUID();
  static final String password = UUID.randomUUID() + "A!";
  static final String adminEmail = "test-admin@finiq.local";
  static final String resetDirectory =
      System.getProperty("java.io.tmpdir") + "/finiq-reset-test-" + UUID.randomUUID();

  @DynamicPropertySource
  static void configure(DynamicPropertyRegistry r) {
    r.add(
        "spring.datasource.url",
        () ->
            System.getenv()
                .getOrDefault("TEST_DATABASE_URL", "jdbc:postgresql://127.0.0.1:55432/finiq_test"));
    r.add("finiq.jwt-secret", () -> jwtSecret);
    r.add("finiq.admin-email", () -> adminEmail);
    r.add("finiq.admin-password", () -> password);
    r.add("finiq.reset-mode", () -> "development");
    r.add("finiq.reset-directory", () -> resetDirectory);
  }

  @Autowired TestRestTemplate http;
  @Autowired JdbcTemplate db;

  ResponseEntity<Map> call(HttpMethod method, String path, Object body, String token) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    if (token != null) headers.setBearerAuth(token);
    return http.exchange("/api/v1" + path, method, new HttpEntity<>(body, headers), Map.class);
  }

  Map register(String suffix) {
    var data = new LinkedHashMap<String, Object>();
    data.put("name", "Integration Learner");
    data.put("email", UUID.randomUUID() + suffix + "@example.test");
    data.put("password", password);
    data.put("language", "en");
    data.put("occupation", "Student");
    data.put("region", "Test region");
    data.put("education", "Undergraduate");
    data.put("consent", true);
    var response = call(HttpMethod.POST, "/auth/register", data, null);
    assertEquals(201, response.getStatusCode().value());
    assertFalse(((Map) response.getBody().get("user")).containsKey("passwordHash"));
    return response.getBody();
  }

  @Test
  @SuppressWarnings("unchecked")
  void criticalWorkflowAndAuthorization() throws Exception {
    assertEquals(401, call(HttpMethod.GET, "/progress", null, null).getStatusCode().value());
    assertEquals(
        400,
        call(HttpMethod.POST, "/auth/register", Map.of("email", "bad"), null)
            .getStatusCode()
            .value());
    var learner = register("one");
    String token = (String) learner.get("token");
    Map user = (Map) learner.get("user");
    int uid = ((Number) user.get("id")).intValue();
    assertEquals(
        403, call(HttpMethod.GET, "/admin/resources/users", null, token).getStatusCode().value());
    assertEquals(
        403, call(HttpMethod.GET, "/institution/analytics", null, token).getStatusCode().value());
    assertEquals(
        401,
        call(
                HttpMethod.POST,
                "/auth/login",
                Map.of("email", user.get("email"), "password", "wrong"),
                null)
            .getStatusCode()
            .value());
    assertEquals(
        200,
        call(
                HttpMethod.POST,
                "/auth/login",
                Map.of("email", user.get("email"), "password", password),
                null)
            .getStatusCode()
            .value());
    var assessment = call(HttpMethod.GET, "/assessments/1", null, token).getBody();
    var questions = (List<Map>) assessment.get("questions");
    assertEquals(7, questions.size());
    assertFalse(((Map) ((List) questions.get(0).get("options")).get(0)).containsKey("correct"));
    assertEquals(
        400,
        call(HttpMethod.POST, "/assessments/1/submit", Map.of("answers", Map.of()), token)
            .getStatusCode()
            .value());
    Map<String, Long> answers = new LinkedHashMap<>();
    for (var q : questions) {
      long id = ((Number) q.get("id")).longValue();
      answers.put(
          String.valueOf(id),
          db.queryForObject(
              "select id from assessment_options where question_id=? and correct", Long.class, id));
    }
    var result =
        call(
            HttpMethod.POST,
            "/assessments/1/submit",
            Map.of("answers", answers, "score", 0),
            token);
    assertEquals(200, result.getStatusCode().value());
    assertEquals(100.0, ((Number) result.getBody().get("score")).doubleValue());
    assertEquals("Advanced", result.getBody().get("classification"));
    assertEquals("score-threshold-baseline-v1", result.getBody().get("method"));
    var other = register("two");
    String otherToken = (String) other.get("token");
    assertEquals(
        404,
        call(HttpMethod.GET, "/attempts/" + result.getBody().get("id"), null, otherToken)
            .getStatusCode()
            .value());
    assertEquals(
        200, call(HttpMethod.POST, "/lessons/1/visit", Map.of(), token).getStatusCode().value());
    for (int i = 0; i < 2; i++)
      assertEquals(
          200,
          call(HttpMethod.POST, "/lessons/1/complete", Map.of(), token).getStatusCode().value());
    var progress = call(HttpMethod.GET, "/progress?days=14", null, token);
    assertEquals(200, progress.getStatusCode().value());
    assertEquals(1, ((Number) progress.getBody().get("completed")).intValue());
    assertEquals(
        1,
        db.queryForObject(
            "select count(*) from engagement_logs where user_id=? and action='COMPLETE_LESSON'",
            Integer.class,
            uid));
    assertEquals(
        200, call(HttpMethod.PUT, "/lessons/1/bookmark", Map.of(), token).getStatusCode().value());
    assertEquals(
        1,
        ((List) call(HttpMethod.GET, "/bookmarks", null, token).getBody().get("lessons")).size());
    assertTrue(((List) progress.getBody().get("achievementHistory")).size() >= 2);
    assertEquals(200, call(HttpMethod.GET, "/schemes/filters", null, null).getStatusCode().value());
    var rec = call(HttpMethod.GET, "/recommendations", null, token);
    assertEquals(200, rec.getStatusCode().value());
    assertEquals("content-rules-baseline-v1", rec.getBody().get("method"));
    assertTrue(
        ((List<Map>) rec.getBody().get("items"))
            .stream().noneMatch(l -> ((Number) l.get("id")).intValue() == 1));
    assertEquals(
        1,
        ((Number) call(HttpMethod.GET, "/schemes?q=PPF", null, null).getBody().get("total"))
            .intValue());
    var search =
        call(
            HttpMethod.POST, "/search", Map.of("question", "PPF savings", "language", "en"), token);
    assertEquals(200, search.getStatusCode().value());
    assertFalse(((List) search.getBody().get("sources")).isEmpty());
    assertEquals("tfidf-retrieval-v1", search.getBody().get("method"));
    assertEquals(
        201,
        call(
                HttpMethod.POST,
                "/contact",
                Map.of(
                    "name",
                    "Test",
                    "email",
                    "test@example.test",
                    "message",
                    "Integration test contact submission."),
                null)
            .getStatusCode()
            .value());
    db.update(
        "update users set password_hash=? where email=?",
        new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(password),
        adminEmail);
    String adminToken =
        (String)
            call(
                    HttpMethod.POST,
                    "/auth/login",
                    Map.of("email", adminEmail, "password", password),
                    null)
                .getBody()
                .get("token");
    var topic =
        call(
            HttpMethod.POST,
            "/admin/resources/topics",
            Map.of("name", "Test " + UUID.randomUUID(), "description", "Test topic"),
            adminToken);
    assertEquals(200, topic.getStatusCode().value());
    assertEquals(
        200,
        call(
                HttpMethod.PUT,
                "/admin/resources/topics/" + topic.getBody().get("id"),
                Map.of("description", "Updated topic"),
                adminToken)
            .getStatusCode()
            .value());
    assertEquals(
        200,
        call(
                HttpMethod.DELETE,
                "/admin/resources/topics/" + topic.getBody().get("id"),
                null,
                adminToken)
            .getStatusCode()
            .value());
    assertEquals(
        400,
        call(
                HttpMethod.PUT,
                "/admin/resources/users/" + uid,
                Map.of("password_hash", "bad"),
                adminToken)
            .getStatusCode()
            .value());
    assertEquals(
        409,
        call(
                HttpMethod.PUT,
                "/admin/resources/questions/" + questions.get(0).get("id"),
                Map.of("prompt", "Changed after attempt"),
                adminToken)
            .getStatusCode()
            .value());
    var inst =
        call(
                HttpMethod.POST,
                "/admin/resources/institutions",
                Map.of("name", "Test institution", "region", "Test"),
                adminToken)
            .getBody();
    var manager = register("manager");
    Map managerUser = (Map) manager.get("user");
    int managerId = ((Number) managerUser.get("id")).intValue();
    assertEquals(
        200,
        call(
                HttpMethod.PUT,
                "/admin/resources/users/" + managerId,
                Map.of("role", "INSTITUTION_ADMIN"),
                adminToken)
            .getStatusCode()
            .value());
    for (int member : new int[] {uid, managerId})
      assertEquals(
          200,
          call(
                  HttpMethod.POST,
                  "/admin/resources/memberships",
                  Map.of("institution_id", inst.get("id"), "user_id", member),
                  adminToken)
              .getStatusCode()
              .value());
    String managerToken =
        (String)
            call(
                    HttpMethod.POST,
                    "/auth/login",
                    Map.of("email", managerUser.get("email"), "password", password),
                    null)
                .getBody()
                .get("token");
    var analytics = call(HttpMethod.GET, "/institution/analytics", null, managerToken);
    assertEquals(200, analytics.getStatusCode().value());
    assertEquals(1, ((Number) analytics.getBody().get("learners")).intValue());
    assertEquals(
        403,
        call(HttpMethod.GET, "/admin/resources/users", null, managerToken).getStatusCode().value());
    assertEquals(
        200,
        call(HttpMethod.POST, "/institution/risk", Map.of(), managerToken).getStatusCode().value());
    var risks =
        (List<Map>)
            call(HttpMethod.GET, "/institution/analytics", null, managerToken)
                .getBody()
                .get("risks");
    assertEquals(1, risks.size());
    assertEquals(uid, ((Number) risks.get(0).get("user_id")).intValue());
    assertEquals("engagement-heuristic-v1", risks.get(0).get("method"));
    assertEquals(
        200,
        call(HttpMethod.POST, "/auth/forgot-password", Map.of("email", user.get("email")), null)
            .getStatusCode()
            .value());
    String file = Files.readString(Path.of(resetDirectory, uid + ".txt"));
    String resetToken = file.split("token=")[1].split("\\n")[0];
    String newPassword = UUID.randomUUID() + "B!";
    assertEquals(
        200,
        call(
                HttpMethod.POST,
                "/auth/reset-password",
                Map.of("token", resetToken, "password", newPassword),
                null)
            .getStatusCode()
            .value());
    assertEquals(
        400,
        call(
                HttpMethod.POST,
                "/auth/reset-password",
                Map.of("token", resetToken, "password", newPassword),
                null)
            .getStatusCode()
            .value());
    assertEquals(401, call(HttpMethod.GET, "/me", null, token).getStatusCode().value());
    String fresh =
        (String)
            call(
                    HttpMethod.POST,
                    "/auth/login",
                    Map.of("email", user.get("email"), "password", newPassword),
                    null)
                .getBody()
                .get("token");
    assertEquals(
        200, call(HttpMethod.POST, "/auth/logout", Map.of(), fresh).getStatusCode().value());
    assertEquals(401, call(HttpMethod.GET, "/me", null, fresh).getStatusCode().value());
    Files.deleteIfExists(Path.of(resetDirectory, uid + ".txt"));
  }
}
