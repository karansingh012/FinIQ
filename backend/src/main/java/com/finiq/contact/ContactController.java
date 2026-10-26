package com.finiq.contact;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
public class ContactController {
  private final JdbcTemplate db;

  public ContactController(JdbcTemplate db) {
    this.db = db;
  }

  public record Contact(
      @NotBlank @Size(max = 120) String name,
      @Email @NotBlank @Size(max = 254) String email,
      @NotBlank @Size(min = 10, max = 5000) String message) {}

  @PostMapping("/api/v1/contact")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Object send(@Valid @RequestBody Contact r) {
    db.update(
        "insert into contact_submissions(name,email,message) values(?,?,?)",
        r.name(),
        r.email(),
        r.message());
    return Map.of("message", "Your message has been saved for the FinIQ team.");
  }
}
