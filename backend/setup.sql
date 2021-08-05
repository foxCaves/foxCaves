CREATE USER foxcaves;
CREATE DATABASE foxcaves;

GRANT ALL PRIVILEGES ON DATABASE foxcaves TO foxcaves;

\c foxcaves foxcaves;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    active INT NOT NULL DEFAULT 0,
    bonusbytes BIGINT NOT NULL DEFAULT 0,
    loginkey VARCHAR(255),
    apikey VARCHAR(255)
);
CREATE UNIQUE INDEX ON users (lower(username));
CREATE UNIQUE INDEX ON users (lower(email));

CREATE TABLE files (
    id VARCHAR(32) PRIMARY KEY,
    "user" BIGINT REFERENCES users (id),
    name VARCHAR(255),
    extension VARCHAR(255),
    type INT,
    size BIGINT,
    time BIGINT,
    thumbnail VARCHAR(255)
);
CREATE INDEX ON files ("user");

CREATE TABLE links (
    id VARCHAR(32) PRIMARY KEY,
    "user" BIGINT REFERENCES users (id),
    url VARCHAR(4096),
    time BIGINT
);
CREATE INDEX ON links ("user");
