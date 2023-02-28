\echo 'Delete and recreate wishlist db?'
\prompt 'Return for yes or control-C to cancel > '

DROP DATABASE wishlist;
CREATE DATABASE wishlist;
\connect wishlist

\i wishlist-schema.sql
\i wishlist-seed.sql

\echo 'Delete and recreate wishlist_test db?'
\prompt 'Return for yes or control-C to cancel > '

DROP DATABASE wishlist_test;
CREATE DATABASE wishlist_test;
\connect wishlist_test

\i wishlist-schema.sql

DROP TABLE users CASCADE;
DROP TABLE items CASCADE;
DROP TABLE wishlist_categories CASCADE;
DROP TABLE item_categories CASCADE;
DROP TABLE user_wishlists CASCADE;
DROP TABLE user_wishlist_items CASCADE;
DROP TABLE follow CASCADE;
DROP TABLE favorite_item CASCADE;

