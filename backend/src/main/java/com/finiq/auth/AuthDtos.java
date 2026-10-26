package com.finiq.auth;

import jakarta.validation.constraints.*;

public class AuthDtos {
  public record Register(
      @NotBlank @Size(max = 120) String name,
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(min = 10, max = 72) String password,
      @Pattern(regexp = "en|hi") @NotNull String language,
      @NotBlank @Size(max = 100) String occupation,
      @NotBlank @Size(max = 120) String region,
      @NotBlank @Size(max = 120) String education,
      @Size(max = 80) String incomeBracket,
      @AssertTrue boolean consent) {}

  public record Login(@Email @NotBlank String email, @NotBlank @Size(max = 72) String password) {}

  public record EmailRequest(@Email @NotBlank String email) {}

  public record Reset(
      @NotBlank String token, @NotBlank @Size(min = 10, max = 72) String password) {}

  public record Profile(
      @NotBlank @Size(max = 120) String name,
      @NotNull @Pattern(regexp = "en|hi") String language,
      @NotBlank @Size(max = 100) String occupation,
      @NotBlank @Size(max = 120) String region,
      @NotBlank @Size(max = 120) String education,
      @Size(max = 80) String incomeBracket,
      @Size(max = 500) String preferences,
      @Min(1) @Max(20) int weeklyGoal) {}
}
