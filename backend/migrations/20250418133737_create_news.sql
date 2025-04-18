CREATE TABLE news (
    id UUID PRIMARY KEY,
    title TEXT,
    content TEXT,
    author UUID REFERENCES users (id),
    editor UUID REFERENCES users (id) NULL,
    created_at timestamp without time zone DEFAULT (now() at time zone 'utc'),
    updated_at timestamp without time zone DEFAULT (now() at time zone 'utc')
);

CREATE INDEX ON news ("author");
CREATE INDEX ON news ("editor");

CREATE INDEX ON news ("created_at");
CREATE INDEX ON news ("updated_at");
