package com.finiq.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
  private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

  private record Window(long start, int count) {}

  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    if (request.getMethod().equals("POST")
        && (request.getRequestURI().startsWith("/api/v1/auth/")
            || request.getRequestURI().equals("/api/v1/contact"))) {
      long now = System.currentTimeMillis();
      windows.entrySet().removeIf(e -> now - e.getValue().start > 60000);
      String key = request.getRemoteAddr();
      Window window =
          windows.compute(
              key,
              (k, v) ->
                  v == null || now - v.start > 60000
                      ? new Window(now, 1)
                      : new Window(v.start, v.count + 1));
      if (window.count > 30 || windows.size() > 10000) {
        response.setStatus(429);
        response.setHeader("Retry-After", "60");
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Too many requests. Try again in a minute.\"}");
        return;
      }
    }
    chain.doFilter(request, response);
  }
}
