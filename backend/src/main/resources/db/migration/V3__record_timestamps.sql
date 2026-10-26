-- Keep creation/update metadata consistent, including records written through JDBC.
CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
DO $$
DECLARE table_name text;
BEGIN
 FOREACH table_name IN ARRAY ARRAY['users','learner_profiles','institutions','institution_memberships','topics','lessons','lesson_bookmarks','lesson_progress','assessments','assessment_questions','assessment_options','assessment_attempts','assessment_responses','government_schemes','policy_documents','scheme_bookmarks','search_history','conversation_history','engagement_logs','learner_recommendations','disengagement_predictions','contact_submissions','audit_logs','password_reset_tokens'] LOOP
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()',table_name);
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()',table_name);
  EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',table_name);
 END LOOP;
END $$;
