package com.finiq.auth;

import com.finiq.common.ApiException;
import com.finiq.domain.*;
import java.nio.file.*;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final UserRepository users;
  private final BCryptPasswordEncoder passwords;
  private final JwtEncoder jwt;
  private final JdbcTemplate db;
  private final JavaMailSender mail;

  @Value("${finiq.reset-mode}")
  String resetMode;

  @Value("${finiq.reset-directory}")
  String resetDirectory;

  @Value("${finiq.cors-origin}")
  String frontend;

  @Value("${finiq.mail-from}")
  String from;

  public AuthService(
      UserRepository users,
      BCryptPasswordEncoder passwords,
      JwtEncoder jwt,
      JdbcTemplate db,
      JavaMailSender mail) {
    this.users = users;
    this.passwords = passwords;
    this.jwt = jwt;
    this.db = db;
    this.mail = mail;
  }

  @Transactional
  public Map<String, Object> register(AuthDtos.Register r) {
    String email = r.email().trim().toLowerCase(Locale.ROOT);
    if (users.findByEmail(email).isPresent())
      throw new ApiException(409, "An account already exists with this email.");
    var u = new User();
    u.name = r.name().trim();
    u.email = email;
    u.passwordHash = passwords.encode(r.password());
    u.role = "LEARNER";
    u.language = r.language();
    u.occupation = r.occupation();
    u.region = r.region();
    u.education = r.education();
    u.incomeBracket = Objects.toString(r.incomeBracket(), "");
    u.knowledgeLevel = "Unassessed";
    u.enabled = true;
    u.createdAt = Instant.now();
    users.saveAndFlush(u);
    db.update("insert into learner_profiles(user_id) values (?)", u.id);
    return session(u);
  }

  public Map<String, Object> login(AuthDtos.Login r) {
    var u = users.findByEmail(r.email().trim().toLowerCase(Locale.ROOT)).orElse(null);
    String hash =
        u == null ? "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW" : u.passwordHash;
    if (!passwords.matches(r.password(), hash) || u == null || !u.enabled)
      throw new ApiException(401, "Email or password is incorrect.");
    return session(u);
  }

  private Map<String, Object> session(User u) {
    Instant now = Instant.now();
    String token =
        jwt.encode(
                JwtEncoderParameters.from(
                    JwsHeader.with(MacAlgorithm.HS256).build(),
                    JwtClaimsSet.builder()
                        .issuer("finiq")
                        .subject(u.id.toString())
                        .issuedAt(now)
                        .expiresAt(now.plusSeconds(3600))
                        .claim("ver", u.tokenVersion)
                        .build()))
            .getTokenValue();
    return Map.of("token", token, "user", u, "expiresIn", 3600);
  }

  public User user(long id) {
    return users.findById(id).orElseThrow(() -> new ApiException(404, "User not found."));
  }

  @Transactional
  public void logout(long id) {
    db.update("update users set token_version=token_version+1 where id=?", id);
  }

  public Map<String, Object> profile(long id) {
    var result = new LinkedHashMap<String, Object>();
    result.put("user", user(id));
    result.put(
        "learning",
        db.queryForMap("select preferences,weekly_goal from learner_profiles where user_id=?", id));
    return result;
  }

  @Transactional
  public Map<String, Object> update(long id, AuthDtos.Profile r) {
    User u = user(id);
    u.name = r.name();
    u.language = r.language();
    u.region = r.region();
    u.occupation = r.occupation();
    u.education = r.education();
    u.incomeBracket = Objects.toString(r.incomeBracket(), "");
    users.save(u);
    db.update(
        "update learner_profiles set preferences=?,weekly_goal=?,updated_at=now() where user_id=?",
        Objects.toString(r.preferences(), ""),
        r.weeklyGoal(),
        id);
    return profile(id);
  }

  public static String hash(String token) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  @Transactional
  public void forgot(String email) {
    var maybe = users.findByEmail(email.trim().toLowerCase(Locale.ROOT));
    if (maybe.isEmpty() || resetMode.equals("disabled")) return;
    User u = maybe.get();
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    db.update("update password_reset_tokens set used=true where user_id=?", u.id);
    db.update(
        "insert into password_reset_tokens(token_hash,user_id,expires_at) values(?,?,?)",
        hash(token),
        u.id,
        java.sql.Timestamp.from(Instant.now().plusSeconds(1800)));
    String link = frontend + "/reset-password?token=" + token;
    try {
      if (resetMode.equals("development")) {
        Path directory = Path.of(resetDirectory);
        Files.createDirectories(directory);
        Files.setPosixFilePermissions(
            directory, java.nio.file.attribute.PosixFilePermissions.fromString("rwx------"));
        Path file = directory.resolve(u.id + ".txt");
        Files.writeString(
            file, "Password reset for " + u.email + "\n" + link + "\nExpires in 30 minutes.");
        Files.setPosixFilePermissions(
            file, java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));
      } else if (resetMode.equals("smtp")) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(u.email);
        msg.setSubject("Reset your FinIQ password");
        msg.setText(link + "\nExpires in 30 minutes. Ignore if you did not request this.");
        mail.send(msg);
      }
    } catch (Exception e) {
      throw new ApiException(503, "Password reset delivery is temporarily unavailable.");
    }
  }

  @Transactional
  public void reset(AuthDtos.Reset r) {
    var rows =
        db.queryForList(
            "select user_id from password_reset_tokens where token_hash=? and not used and"
                + " expires_at>now() for update",
            hash(r.token()));
    if (rows.isEmpty()) throw new ApiException(400, "Reset link is invalid or expired.");
    long id = ((Number) rows.get(0).get("user_id")).longValue();
    db.update(
        "update users set password_hash=?,token_version=token_version+1 where id=?",
        passwords.encode(r.password()),
        id);
    db.update("update password_reset_tokens set used=true where user_id=?", id);
  }
}
