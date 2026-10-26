package com.finiq.prediction;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class MlClient {
  private final RestClient client;

  public MlClient(@Value("${finiq.ml-url}") String url) {
    var factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(2000);
    factory.setReadTimeout(4000);
    client = RestClient.builder().baseUrl(url).requestFactory(factory).build();
  }

  @SuppressWarnings("unchecked")
  public Map<String, Object> call(String path, Object request) {
    return client.post().uri(path).body(request).retrieve().body(Map.class);
  }

  public Map<String, Object> classify(double score) {
    try {
      return call("/classify", Map.of("score", score));
    } catch (Exception e) {
      return Map.of(
          "level",
          score >= 80 ? "Advanced" : score >= 50 ? "Intermediate" : "Beginner",
          "method",
          "score-threshold-baseline-v1-java-fallback");
    }
  }
}
