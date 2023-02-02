CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    active INT NOT NULL,
    storage_quota BIGINT NOT NULL,
    loginkey VARCHAR(255),
    apikey VARCHAR(255),
    created_at timestamp without time zone DEFAULT (now() at time zone 'utc'),
    updated_at timestamp without time zone DEFAULT (now() at time zone 'utc')
);
CREATE UNIQUE INDEX ON users (lower(username));
CREATE UNIQUE INDEX ON users (lower(email));

CREATE TABLE files (
    id VARCHAR(32) PRIMARY KEY,
    "user" UUID REFERENCES users (id),
    name VARCHAR(255),
    size BIGINT,
    thumbnail_mimetype VARCHAR(255),
    mimetype VARCHAR(255),
    created_at timestamp without time zone DEFAULT (now() at time zone 'utc'),
    updated_at timestamp without time zone DEFAULT (now() at time zone 'utc')
);
CREATE INDEX ON files ("user");

CREATE TABLE links (
    id VARCHAR(32) PRIMARY KEY,
    "user" UUID REFERENCES users (id),
    url VARCHAR(4096),
    created_at timestamp without time zone DEFAULT (now() at time zone 'utc'),
    updated_at timestamp without time zone DEFAULT (now() at time zone 'utc')
);
CREATE INDEX ON links ("user");
