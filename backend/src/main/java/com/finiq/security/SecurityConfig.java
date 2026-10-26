package com.finiq.security;

import com.finiq.domain.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  @Bean
  BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  JwtEncoder encoder(@Value("${finiq.jwt-secret}") String secret) {
    if (secret.length() < 32)
      throw new IllegalArgumentException("JWT_SECRET must contain at least 32 characters");
    return new NimbusJwtEncoder(
        new com.nimbusds.jose.jwk.source.ImmutableSecret<>(
            secret.getBytes(StandardCharsets.UTF_8)));
  }

  @Bean
  JwtDecoder decoder(@Value("${finiq.jwt-secret}") String secret) {
    var decoder =
        NimbusJwtDecoder.withSecretKey(
                new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"))
            .macAlgorithm(MacAlgorithm.HS256)
            .build();
    decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer("finiq"));
    return decoder;
  }

  @Bean
  SecurityFilterChain security(
      HttpSecurity http, UserRepository users, @Value("${finiq.cors-origin}") String origin)
      throws Exception {
    var cors = new CorsConfiguration();
    cors.setAllowedOrigins(List.of(origin));
    cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cors);
    http.csrf(c -> c.disable())
        .cors(c -> c.configurationSource(source))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            a ->
                a.dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR)
                    .permitAll()
                    .requestMatchers(
                        "/api/v1/auth/register",
                        "/api/v1/auth/login",
                        "/api/v1/auth/forgot-password",
                        "/api/v1/auth/reset-password",
                        "/api/v1/contact",
                        "/actuator/health",
                        "/docs",
                        "/swagger-ui/**",
                        "/v3/api-docs/**")
                    .permitAll()
                    .requestMatchers(
                        org.springframework.http.HttpMethod.GET,
                        "/api/v1/lessons/**",
                        "/api/v1/schemes/**",
                        "/api/v1/topics")
                    .permitAll()
                    .requestMatchers("/api/v1/admin/**")
                    .hasRole("PLATFORM_ADMIN")
                    .requestMatchers("/api/v1/institution/**")
                    .hasAnyRole("PLATFORM_ADMIN", "INSTITUTION_ADMIN")
                    .anyRequest()
                    .authenticated())
        .oauth2ResourceServer(
            o ->
                o.jwt(
                    j ->
                        j.jwtAuthenticationConverter(
                            jwt -> {
                              if (jwt.getSubject() == null
                                  || !jwt.getSubject().matches("[0-9]{1,18}")
                                  || !(jwt.getClaim("ver") instanceof Number))
                                throw new org.springframework.security.oauth2.core
                                    .OAuth2AuthenticationException("invalid_token");
                              var u =
                                  users
                                      .findById(Long.valueOf(jwt.getSubject()))
                                      .orElseThrow(
                                          () ->
                                              new org.springframework.security.oauth2.core
                                                  .OAuth2AuthenticationException("invalid_token"));
                              if (!u.enabled
                                  || u.tokenVersion != ((Number) jwt.getClaim("ver")).intValue())
                                throw new org.springframework.security.oauth2.core
                                    .OAuth2AuthenticationException("invalid_token");
                              return new JwtAuthenticationToken(
                                  jwt, List.of(new SimpleGrantedAuthority("ROLE_" + u.role)));
                            })))
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                    (req, res, ex) -> {
                      res.setStatus(401);
                      res.setContentType("application/json");
                      res.getWriter().write("{\"message\":\"Please sign in again.\"}");
                    }));
    return http.build();
  }
}
