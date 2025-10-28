ALTER TABLE users RENAME COLUMN active TO email_valid;
ALTER TABLE users ADD COLUMN approved INT NOT NULL DEFAULT 0;
ALTER TABLE users ALTER COLUMN approved DROP DEFAULT;

CREATE INDEX email_valid ON users(email_valid);
CREATE INDEX approved ON users(approved);
