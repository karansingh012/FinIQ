package com.finiq;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.finiq.assessment.AssessmentService;
import com.finiq.common.ApiException;
import com.finiq.common.Db;
import com.finiq.prediction.MlClient;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class BaselineTest {
  @Test
  void classifierFallbackIsExplicit() {
    var ml = new MlClient("http://127.0.0.1:1");
    assertEquals("Beginner", ml.classify(49).get("level"));
    assertEquals("Intermediate", ml.classify(50).get("level"));
    assertEquals("Advanced", ml.classify(80).get("level"));
    assertTrue(ml.classify(80).get("method").toString().contains("fallback"));
  }

  @Test
  void refusesAnswersFromAnotherQuestion() {
    JdbcTemplate jdbc = mock(JdbcTemplate.class);
    Db db = new Db(jdbc);
    MlClient ml = mock(MlClient.class);
    when(jdbc.queryForList("select id from assessments where id=? and not deleted for update", 1L))
        .thenReturn(List.of(Map.of("id", 1L)));
    when(jdbc.queryForObject(anyString(), eq(Long.class), eq(1L))).thenReturn(0L);
    when(jdbc.queryForList("select id from assessment_questions where assessment_id=?", 1L))
        .thenReturn(List.of(Map.of("id", 10L)));
    when(jdbc.queryForList(
            "select id,correct from assessment_options where question_id=? and id=?", 10L, 99L))
        .thenReturn(List.of());
    assertThrows(
        ApiException.class,
        () ->
            new AssessmentService(db, ml)
                .submit(1L, 1L, new AssessmentService.Submission(Map.of(10L, 99L))));
    verifyNoInteractions(ml);
  }
}
