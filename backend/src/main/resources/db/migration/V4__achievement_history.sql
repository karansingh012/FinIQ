CREATE TABLE user_achievements (
 id bigserial PRIMARY KEY,
 user_id bigint NOT NULL REFERENCES users(id),
 code varchar(40) NOT NULL,
 title varchar(160) NOT NULL,
 awarded_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,code)
);
INSERT INTO user_achievements(user_id,code,title,awarded_at)
SELECT user_id,'FIRST_LESSON','First lesson completed',min(completed_at) FROM lesson_progress WHERE completed GROUP BY user_id;
INSERT INTO user_achievements(user_id,code,title,awarded_at)
SELECT user_id,'FIRST_QUIZ','First knowledge check',min(created_at) FROM assessment_attempts GROUP BY user_id;
INSERT INTO user_achievements(user_id,code,title,awarded_at)
SELECT user_id,'FIVE_LESSONS','Five lessons completed',completed_at FROM
(SELECT user_id,completed_at,row_number() OVER(PARTITION BY user_id ORDER BY completed_at) n FROM lesson_progress WHERE completed) p WHERE n=5;
