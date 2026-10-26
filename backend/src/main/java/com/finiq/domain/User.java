package com.finiq.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String name;
  public String email;
  @JsonIgnore public String passwordHash;
  public String role;
  public String language;
  public String occupation;
  public String region;
  public String education;
  public String incomeBracket;
  public String knowledgeLevel;
  @JsonIgnore public int tokenVersion;
  public boolean enabled;
  public java.time.Instant createdAt;
}
