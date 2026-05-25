CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password TEXT NOT NULL,
    added_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_timestamp TIMESTAMP,
    is_deleted INT2
);

CREATE TABLE databases (
    database_id SERIAL PRIMARY KEY,
    database_name VARCHAR(100) NOT NULL,
    db_connection JSONB NOT NULL DEFAULT {},
    fk_user_id INT8 NOT NULL,
    added_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_timestamp TIMESTAMP,
    is_connected INT2 NOT NULL DEFAULT 0,
);

CREATE TABLE snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    unique_snapshot_id VARCHAR(100) NOT NULL,
    fk_database_id INT8 NOT NULL,
    captured_at TIMESTAMP NOT NULL,
    captured_by INT8 NOT NULL
);

CREATE TABLE snapshot_queries (
    query_id SERIAL PRIMARY KEY,
    query_text TEXT NOT NULL,
    pg_stat_queryId VARCHAR NOT NULL,
    fk_snapshot_id INT8 NOT NULL,
    calls INT8 NOT NULL DEFAULT 0,
    total_exec_time DECIMAL NULL,
    mean_exec_time DECIMAL NULL,
    added_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
)