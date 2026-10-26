package com.finiq.progress;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ProgressController {
  private final ProgressService service;

  public ProgressController(ProgressService service) {
    this.service = service;
  }

  @GetMapping("/progress")
  public Object progress(
      @AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "14") int days) {
    return service.progress(Long.parseLong(jwt.getSubject()), days);
  }

  @GetMapping("/recommendations")
  public Object recommendations(@AuthenticationPrincipal Jwt jwt) {
    return service.recommend(Long.parseLong(jwt.getSubject()));
  }
}
