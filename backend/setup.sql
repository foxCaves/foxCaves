CREATE USER foxcaves;
CREATE DATABASE foxcaves;

GRANT ALL PRIVILEGES ON DATABASE foxcaves TO foxcaves;

\c foxcaves;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255),
    email VARCHAR(255),
    password VARBINARY(255),
    active INT,
    bonusbytes INT,
    loginkey VARBINARY(255),
    apikey VARBINARY(255)
);
CREATE UNIQUE INDEX ON users (lower(username));
CREATE UNIQUE INDEX ON users (lower(email));

CREATE TABLE files (
    id VARCHAR(32) PRIMARY KEY,
    "user" INT REFERENCES users (id),
    name VARCHAR(255),
    extension VARCHAR(255),
    type INT,
    size INT,
    time INT,
    thumbnail VARCHAR(255)
);
CREATE INDEX ON files ("user");

CREATE TABLE links (
    id VARCHAR(32) PRIMARY KEY,
    "user" INT REFERENCES users (id),
    url VARCHAR(4096),
    time INT
);
CREATE INDEX ON links ("user");
