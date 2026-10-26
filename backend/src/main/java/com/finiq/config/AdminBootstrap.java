package com.finiq.config;

import com.finiq.domain.*;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements ApplicationRunner {
  private final UserRepository users;
  private final BCryptPasswordEncoder encoder;
  private final JdbcTemplate db;

  @Value("${finiq.admin-email}")
  String email;

  @Value("${finiq.admin-password}")
  String password;

  public AdminBootstrap(UserRepository users, BCryptPasswordEncoder encoder, JdbcTemplate db) {
    this.users = users;
    this.encoder = encoder;
    this.db = db;
  }

  public void run(ApplicationArguments args) {
    if (email.isBlank() || password.isBlank() || users.findByEmail(email.toLowerCase()).isPresent())
      return;
    if (password.length() < 12 || password.length() > 72)
      throw new IllegalArgumentException("Bootstrap admin password must be 12–72 characters");
    User u = new User();
    u.name = "Platform administrator";
    u.email = email.toLowerCase();
    u.passwordHash = encoder.encode(password);
    u.role = "PLATFORM_ADMIN";
    u.language = "en";
    u.occupation = "Educator";
    u.region = "";
    u.education = "";
    u.incomeBracket = "";
    u.knowledgeLevel = "Unassessed";
    u.enabled = true;
    u.createdAt = Instant.now();
    users.saveAndFlush(u);
    db.update("insert into learner_profiles(user_id) values (?)", u.id);
  }
}
