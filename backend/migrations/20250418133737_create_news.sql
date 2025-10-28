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
