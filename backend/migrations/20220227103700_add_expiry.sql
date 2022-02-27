ALTER TABLE files ADD expires_at timestamp without time zone DEFAULT NULL;
ALTER TABLE links ADD expires_at timestamp without time zone DEFAULT NULL;
