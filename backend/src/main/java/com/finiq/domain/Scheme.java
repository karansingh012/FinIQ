package com.finiq.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "government_schemes")
public class Scheme {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String title;
  public String category;
  public String region;
  public String beneficiaries;
  public String summary;
  public String eligibility;
  public String benefits;
  public String documents;
  public String procedure;
  public String faq;
  public String sourceUrl;
  public String verification;
  public boolean deleted;
  public java.time.Instant createdAt;
  public java.time.Instant updatedAt;
}
