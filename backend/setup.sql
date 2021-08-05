CREATE USER foxcaves;
CREATE DATABASE foxcaves;

GRANT ALL PRIVILEGES ON DATABASE foxcaves TO foxcaves;

USE foxcaves;

CREATE TABLE files (
    id VARCHAR(32) PRIMARY KEY,
    user INT INDEX,
    name VARCHAR(255),
    extension VARCHAR(255),
    type INT,
    size INT,
    time INT,
    thumbnail VARCHAR(255)
);

CREATE TABLE links (
    id VARCHAR(32) PRIMARY KEY,
    user INT INDEX,
    url VARCHAR(4096),
    time INT
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE KEY,
    email VARCHAR(255) UNIQUE KEY,
    password VARBINARY(255),
    active INT,
    bonusbytes INT,
    loginkey VARBINARY(255),
    apikey VARBINARY(255)
);
