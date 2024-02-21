CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(255),
    username VARCHAR(255) UNIQUE,
    language_code VARCHAR(10),
    profile_image_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    from_consultant BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE suggestions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    suggestion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
