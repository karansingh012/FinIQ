package com.finiq.admin;

import com.finiq.analytics.AnalyticsService;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AdminController {
  private final AdminService admin;
  private final AnalyticsService analytics;

  public AdminController(AdminService a, AnalyticsService b) {
    admin = a;
    analytics = b;
  }

  private long uid(Jwt j) {
    return Long.parseLong(j.getSubject());
  }

  @GetMapping("/admin/metadata")
  public Object metadata() {
    return admin.metadata();
  }

  @GetMapping("/admin/resources/{name}")
  public Object list(
      @PathVariable String name,
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "15") int size,
      @RequestParam(defaultValue = "recent") String sort) {
    return admin.list(name, q, page, size, sort);
  }

  @PostMapping("/admin/resources/{name}")
  public Object create(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String name,
      @RequestBody Map<String, Object> data) {
    return admin.save(uid(jwt), name, null, data);
  }

  @PutMapping("/admin/resources/{name}/{id}")
  public Object update(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable String name,
      @PathVariable long id,
      @RequestBody Map<String, Object> data) {
    return admin.save(uid(jwt), name, id, data);
  }

  @DeleteMapping("/admin/resources/{name}/{id}")
  public Object delete(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String name, @PathVariable long id) {
    return admin.delete(uid(jwt), name, id);
  }

  @GetMapping({"/admin/analytics", "/institution/analytics"})
  public Object analytics(
      @AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "30") int days) {
    return analytics.overview(uid(jwt), days);
  }

  @PostMapping({"/admin/risk", "/institution/risk"})
  public Object risk(@AuthenticationPrincipal Jwt jwt) {
    return analytics.refreshRisk(uid(jwt));
  }
}
