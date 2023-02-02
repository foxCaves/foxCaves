CREATE INDEX ON links ("created_at");
CREATE INDEX ON links ("updated_at");
CREATE INDEX ON links ("expires_at");


CREATE INDEX ON files ("uploaded");
CREATE INDEX ON files ("created_at");
CREATE INDEX ON files ("updated_at");
CREATE INDEX ON files ("expires_at");

CREATE INDEX ON files ("extension");
CREATE INDEX ON files ("size");
CREATE INDEX ON files ("mimetype");
