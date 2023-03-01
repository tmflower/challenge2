\echo 'Delete and recreate challenge2 db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE challenge2;
CREATE DATABASE challenge2;
\connect challenge2

\i challenge2-schema.sql
\i seed.sql

\echo 'Delete and recreate challenge2_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE challenge2_test;
CREATE DATABASE challenge2_test;
\connect challenge2_test

\i challenge2-schema.sql
\i seed.sql