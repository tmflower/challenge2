INSERT INTO users (user_name, user_age, user_fav_color)
VALUES
('Taylor Swift',27,'red'),
('Idris Elba',58,'green'),
('Emma Watson',28,'blue'),
('Emilia Clarke',30,'magenta'),
('Chris Martin',40,'green');

INSERT INTO locations (last_location, lat, long)
VALUES
('San Francisco',37.774929,-122.419416),
('Oakland',37.8044,-122.2711),
('Washington-DC',38.89565,-76.943174),
('Los Angeles',34.062264,-118.340361),
('Daly City',37.68941,-122.462532),
('Whitestone, UK',0,0);

INSERT INTO users_locations (user_name, last_location)
VALUES
('Taylor Swift', 'San Francisco'),
('Taylor Swift', 'Oakland'),
('Idris Elba', 'Washington-DC'),
('Emma Watson', 'Los Angeles'),
('Emma Watson', 'Daly City'),
('Emilia Clarke', 'Los Angeles'),
('Chris Martin', 'Whitestone, UK');



-- Seed data from original attempt with all data in single table

-- INSERT INTO users (user_id, user_name, user_age, user_fav_color, last_location, lat, long)
-- VALUES
-- (1,'Taylor Swift',27,'red','San Francisco',37.774929,-122.419416),
-- (1,'Taylor Swift',27,'red','Oakland',37.8044,-122.2711),
-- (2,'Idris Elba',58,'green','Washington-DC',38.89565,-76.943174),
-- (3,'Emma Watson',28,'blue','Los Angeles',34.062264,-118.340361),
-- (3,'Emma Watson',28,'blue','Daly City',37.68941,-122.462532),
-- (4,'Emilia Clarke',30,'magenta','Los Angeles',34.043566,-118.391092),
-- (5,'Chris Martin',40,'green','Whitestone, UK',0,0)