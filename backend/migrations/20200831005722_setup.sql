CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    active INT NOT NULL,
    storage_quota BIGINT NOT NULL,
    security_version INT NOT NULL,
    api_key VARCHAR(255),
    admin INT NOT NULL DEFAULT 0,
    created_at timestamp without time zone DEFAULT (now() at time zone 'utc'),
    updated_at timestamp without time zone DEFAULT (now() at time zone 'utc')
);

CREATE UNIQUE INDEX ON users (lower(username));
CREATE UNIQUE INDEX ON users (lower(email));


CREATE TABLE files (
    id VARCHAR(32) PRIMARY KEY,
    owner UUID REFERENCES users (id),
    name VARCHAR(255),
    size BIGINT,
    thumbnail_mimetype VARCHAR(255),
    uploaded INT NOT NULL,
    storage VARCHAR(16) NOT NULL,
    created_at timestamp without time zone DEFAULT (now() at time zone 'utc'),
    updated_at timestamp without time zone DEFAULT (now() at time zone 'utc'),
    expires_at timestamp without time zone DEFAULT NULL
);

CREATE INDEX ON files ("owner");

CREATE INDEX ON files ("created_at");
CREATE INDEX ON files ("updated_at");
CREATE INDEX ON files ("expires_at");

CREATE INDEX ON files ("uploaded");
CREATE INDEX ON files ("size");


CREATE TABLE links (
    id VARCHAR(32) PRIMARY KEY,
    owner UUID REFERENCES users (id),
    url VARCHAR(4096),
    created_at timestamp without time zone DEFAULT (now() at time zone 'utc'),
    updated_at timestamp without time zone DEFAULT (now() at time zone 'utc'),
    expires_at timestamp without time zone DEFAULT NULL
);

CREATE INDEX ON links ("owner");

CREATE INDEX ON links ("created_at");
CREATE INDEX ON links ("updated_at");
CREATE INDEX ON links ("expires_at");
