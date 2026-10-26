package com.finiq.auth;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
  private final AuthService service;

  public AuthController(AuthService service) {
    this.service = service;
  }

  @PostMapping("/auth/register")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Object register(@Valid @RequestBody AuthDtos.Register r) {
    return service.register(r);
  }

  @PostMapping("/auth/login")
  public Object login(@Valid @RequestBody AuthDtos.Login r) {
    return service.login(r);
  }

  @PostMapping("/auth/logout")
  public Object logout(@AuthenticationPrincipal Jwt jwt) {
    service.logout(Long.parseLong(jwt.getSubject()));
    return Map.of("message", "Signed out.");
  }

  @GetMapping("/me")
  public Object me(@AuthenticationPrincipal Jwt jwt) {
    return service.profile(Long.parseLong(jwt.getSubject()));
  }

  @PutMapping("/me")
  public Object update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AuthDtos.Profile r) {
    return service.update(Long.parseLong(jwt.getSubject()), r);
  }

  @PostMapping("/auth/forgot-password")
  public Object forgot(@Valid @RequestBody AuthDtos.EmailRequest r) {
    service.forgot(r.email());
    return Map.of(
        "message", "If this account exists and delivery is configured, a reset link will be sent.");
  }

  @PostMapping("/auth/reset-password")
  public Object reset(@Valid @RequestBody AuthDtos.Reset r) {
    service.reset(r);
    return Map.of("message", "Password reset. You can now sign in.");
  }
}
