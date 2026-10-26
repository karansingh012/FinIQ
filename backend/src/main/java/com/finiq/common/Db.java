package com.finiq.common;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class Db {
  public final JdbcTemplate jdbc;

  public Db(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public Map<String, Object> one(String sql, Object... args) {
    var rows = jdbc.queryForList(sql, args);
    if (rows.isEmpty()) throw new ApiException(404, "Record not found.");
    return rows.get(0);
  }

  public long count(String sql, Object... args) {
    return jdbc.queryForObject(sql, Long.class, args);
  }

  public static long id(Map<String, Object> row, String key) {
    return ((Number) row.get(key)).longValue();
  }

  public static int page(int page) {
    return Math.max(0, page);
  }

  public static int size(int size) {
    return Math.min(100, Math.max(1, size));
  }
}
