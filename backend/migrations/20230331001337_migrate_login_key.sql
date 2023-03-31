ALTER TABLE users DROP login_key;
ALTER TABLE users ADD security_version INT NOT NULL DEFAULT 1;
ALTER TABLE users ALTER security_version DROP DEFAULT;
