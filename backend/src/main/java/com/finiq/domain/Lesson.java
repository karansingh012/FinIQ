package com.finiq.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "lessons")
public class Lesson {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String title;
  public String description;

  @Column(name = "topic_id")
  public Long topicId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "topic_id", insertable = false, updatable = false)
  @JsonIgnore
  public Topic topic;

  public String difficulty;
  public int duration;
  public String objectives;
  public String content;
  public String example;
  public String takeaways;
  public String sourceUrl;
  public boolean deleted;
  public java.time.Instant createdAt;
  public java.time.Instant updatedAt;
}
