package com.finiq.lesson;

import com.finiq.assessment.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class LearningController {
  private final CatalogService catalog;
  private final AssessmentService assessments;

  public LearningController(CatalogService c, AssessmentService a) {
    catalog = c;
    assessments = a;
  }

  private long uid(Jwt jwt) {
    return Long.parseLong(jwt.getSubject());
  }

  @GetMapping("/schemes/filters")
  public Object schemeFilters() {
    return catalog.schemeFilters();
  }

  @GetMapping("/topics")
  public Object topics() {
    return catalog.topics();
  }

  @GetMapping("/lessons")
  public Object lessons(
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "") String topic,
      @RequestParam(defaultValue = "") String difficulty,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return catalog.list(false, q, topic, difficulty, "", "", page, size);
  }

  @GetMapping("/schemes")
  public Object schemes(
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "") String category,
      @RequestParam(defaultValue = "") String region,
      @RequestParam(defaultValue = "") String beneficiary,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return catalog.list(true, q, category, "", region, beneficiary, page, size);
  }

  @GetMapping("/lessons/{id}")
  public Object lesson(@PathVariable long id) {
    return catalog.detail(false, id);
  }

  @GetMapping("/schemes/{id}")
  public Object scheme(@PathVariable long id) {
    return catalog.detail(true, id);
  }

  @PostMapping("/lessons/{id}/visit")
  public Object visitLesson(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
    return catalog.visit(uid(jwt), id, false);
  }

  @PostMapping("/schemes/{id}/visit")
  public Object visitScheme(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
    return catalog.visit(uid(jwt), id, true);
  }

  @PostMapping("/lessons/{id}/complete")
  public Object complete(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
    return catalog.complete(uid(jwt), id);
  }

  @PutMapping("/lessons/{id}/bookmark")
  public Object saveLesson(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
    return catalog.bookmark(uid(jwt), id, false, true);
  }

  @DeleteMapping("/lessons/{id}/bookmark")
  public Object removeLesson(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
    return catalog.bookmark(uid(jwt), id, false, false);
  }

  @PutMapping("/schemes/{id}/bookmark")
  public Object saveScheme(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
    return catalog.bookmark(uid(jwt), id, true, true);
  }

  @DeleteMapping("/schemes/{id}/bookmark")
  public Object removeScheme(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
    return catalog.bookmark(uid(jwt), id, true, false);
  }

  @GetMapping("/bookmarks")
  public Object bookmarks(@AuthenticationPrincipal Jwt jwt) {
    return catalog.bookmarks(uid(jwt));
  }

  @GetMapping("/assessments/{id}")
  public Object assessment(@PathVariable long id) {
    return assessments.get(id);
  }

  @PostMapping("/assessments/{id}/submit")
  public Object submit(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable long id,
      @Valid @RequestBody AssessmentService.Submission r) {
    return assessments.submit(uid(jwt), id, r);
  }

  @GetMapping("/attempts/{id}")
  public Object result(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
    return assessments.result(uid(jwt), id);
  }
}
