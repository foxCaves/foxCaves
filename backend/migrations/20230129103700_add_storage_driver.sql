ALTER TABLE files ADD storage_driver VARCHAR(16) NOT NULL DEFAULT 'local';
ALTER TABLE files ALTER storage_driver DROP DEFAULT;
