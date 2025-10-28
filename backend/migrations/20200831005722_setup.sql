CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    email_valid INT NOT NULL,
    storage_quota BIGINT NOT NULL,
    security_version INT NOT NULL,
    api_key VARCHAR(255),
    admin INT NOT NULL DEFAULT 0,
    approved INT NOT NULL,
    totp_secret VARCHAR(255) NOT NULL,
    created_at timestamp,
    updated_at timestamp
);

CREATE UNIQUE INDEX username ON users(username);
CREATE UNIQUE INDEX email ON users(email);


CREATE TABLE files (
    id VARCHAR(32) PRIMARY KEY,
    owner UUID REFERENCES users (id),
    name VARCHAR(255),
    size BIGINT,
    thumbnail_mimetype VARCHAR(255),
    uploaded INT NOT NULL,
    storage VARCHAR(16) NOT NULL,
    created_at timestamp,
    updated_at timestamp,
    expires_at timestamp
);

CREATE INDEX `owner` ON files(`owner`);

CREATE INDEX `created_at` ON files(`created_at`);
CREATE INDEX `updated_at` ON files(`updated_at`);
CREATE INDEX `expires_at` ON files(`expires_at`);

CREATE INDEX `uploaded` ON files(`uploaded`);
CREATE INDEX `size` ON files(`size`);


CREATE TABLE links (
    id VARCHAR(32) PRIMARY KEY,
    owner UUID REFERENCES users (id),
    target VARCHAR(4096),
    created_at timestamp,
    updated_at timestamp,
    expires_at timestamp
);

CREATE INDEX `owner` ON links(`owner`);

CREATE INDEX `created_at` ON links(`created_at`);
CREATE INDEX `updated_at` ON links(`updated_at`);
CREATE INDEX `expires_at` ON links(`expires_at`);


CREATE TABLE news (
    id UUID PRIMARY KEY,
    title TEXT,
    content TEXT,
    author UUID REFERENCES users(id),
    editor UUID NULL REFERENCES users(id),
    created_at timestamp,
    updated_at timestamp
);

CREATE INDEX `author` ON news(`author`);
CREATE INDEX `editor` ON news(`editor`);

CREATE INDEX `created_at` ON news(`created_at`);
CREATE INDEX `updated_at` ON news(`updated_at`);
