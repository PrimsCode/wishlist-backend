CREATE TABLE users (
  username VARCHAR(25) PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_pic TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE item_categories (
    id SERIAL PRIMARY KEY,
    category VARCHAR(40) UNIQUE NOT NULL,
    color_code VARCHAR UNIQUE NOT NULL
);

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  price DECIMAL NOT NULL,
  description VARCHAR(500),
  category_id INTEGER NOT NULL
    REFERENCES item_categories ON DELETE CASCADE,
  link TEXT UNIQUE NOT NULL,
  image_link TEXT
);

CREATE TABLE favorite_item (
    username VARCHAR NOT NULL
        REFERENCES users ON DELETE CASCADE,
    item_id INTEGER NOT NULL
        REFERENCES items ON DELETE CASCADE,
    PRIMARY KEY (username, item_id)
);

CREATE TABLE wishlist_categories (
    id SERIAL PRIMARY KEY,
    category VARCHAR(40) UNIQUE NOT NULL,
    color_code VARCHAR UNIQUE NOT NULL
);

CREATE TABLE user_wishlists (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL
        REFERENCES users ON DELETE CASCADE,
    category_id INTEGER NOT NULL
        REFERENCES wishlist_categories ON DELETE CASCADE,
    description VARCHAR(500),
    title VARCHAR(300) NOT NULL,
    banner_img VARCHAR,
    date_time TIMESTAMP
);

CREATE TABLE user_wishlist_items (
    item_id INTEGER NOT NULL
        REFERENCES items ON DELETE CASCADE,
    wishlist_id INTEGER NOT NULL
        REFERENCES user_wishlists ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    must_have BOOLEAN NOT NULL DEFAULT FALSE,
    purchase BOOLEAN NOT NULL DEFAULT FALSE,
    date_time TIMESTAMP,
    PRIMARY KEY (item_id, wishlist_id)
);

CREATE TABLE follow (
    username VARCHAR
        REFERENCES users ON DELETE CASCADE,
    following VARCHAR
        REFERENCES users ON DELETE CASCADE,
    PRIMARY KEY (username, following)
);