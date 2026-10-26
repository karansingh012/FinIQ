package com.finiq.search;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {
  private final SearchService service;

  public SearchController(SearchService service) {
    this.service = service;
  }

  @PostMapping
  public Object ask(
      @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SearchService.Question q) {
    return service.ask(Long.parseLong(jwt.getSubject()), q);
  }

  @GetMapping("/history")
  public Object history(@AuthenticationPrincipal Jwt jwt) {
    return service.history(Long.parseLong(jwt.getSubject()));
  }
}
