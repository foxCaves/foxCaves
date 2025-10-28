CREATE TABLE users (
    id UUID NOT NULL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email_valid INT NOT NULL,
    storage_quota BIGINT NOT NULL,
    security_version INT NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    admin INT NOT NULL DEFAULT 0,
    approved INT NOT NULL,
    totp_secret VARCHAR(255) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX username ON users(username);
CREATE UNIQUE INDEX email ON users(email);


CREATE TABLE files (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    owner UUID NOT NULL REFERENCES users (id) ON UPDATE CASCADE,
    name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    thumbnail_mimetype VARCHAR(255) NOT NULL,
    uploaded INT NOT NULL,
    storage VARCHAR(16) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at timestamp NULL
);

CREATE INDEX `owner` ON files(`owner`);

CREATE INDEX `created_at` ON files(`created_at`);
CREATE INDEX `updated_at` ON files(`updated_at`);
CREATE INDEX `expires_at` ON files(`expires_at`);

CREATE INDEX `uploaded` ON files(`uploaded`);
CREATE INDEX `size` ON files(`size`);


CREATE TABLE links (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    owner UUID NOT NULL REFERENCES users (id) ON UPDATE CASCADE,
    target VARCHAR(4096) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at timestamp NULL
);

CREATE INDEX `owner` ON links(`owner`);

CREATE INDEX `created_at` ON links(`created_at`);
CREATE INDEX `updated_at` ON links(`updated_at`);
CREATE INDEX `expires_at` ON links(`expires_at`);


CREATE TABLE news (
    id UUID NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    editor UUID NULL REFERENCES users(id) ON UPDATE CASCADE,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX `author` ON news(`author`);
CREATE INDEX `editor` ON news(`editor`);

CREATE INDEX `created_at` ON news(`created_at`);
CREATE INDEX `updated_at` ON news(`updated_at`);
