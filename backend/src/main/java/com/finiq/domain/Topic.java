package com.finiq.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "topics")
public class Topic {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String name;
  public String description;
  public boolean deleted;
  public java.time.Instant createdAt;
}
