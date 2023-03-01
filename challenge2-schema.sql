CREATE TABLE users (
    user_id SERIAL,
    user_name VARCHAR PRIMARY KEY, 
    user_age INTEGER, 
    user_fav_color VARCHAR
);

CREATE TABLE locations (
    location_id SERIAL,
    last_location VARCHAR PRIMARY KEY, 
    lat DECIMAL, 
    long DECIMAL
);

CREATE TABLE users_locations (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR REFERENCES users ON DELETE CASCADE,
    last_location VARCHAR REFERENCES locations ON DELETE CASCADE
)