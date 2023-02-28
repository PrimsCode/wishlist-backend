"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {userExistCheck, wishlistCategoryCheck, userWishlistExistCheck, itemInWishlistCheck} = require("../helpers/checks");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");


class User {

  /** Register a new user
   *  Requests {username, password, firstName, lastName, profilePic, isAdmin}
   *  Returns {username, firstName, lastName, profilePic, isAdmin} 
   *  Throws BadRequestError on duplicates or blank Not Null fields
   * */
   static async register({ username, password, firstName, lastName, profilePic, isAdmin }) {
      const duplicateCheck = await userExistCheck();
      if (duplicateCheck) throw new BadRequestError(`${username} already exists`);

      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      const result = await db.query(
            `INSERT INTO users
            (username,
              password,
              first_name,
              last_name,
              profile_pic,
              is_admin)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING username, first_name AS "firstName", last_name AS "lastName", profile_pic AS "profilePic", is_admin AS "isAdmin"`,
          [
            username,
            hashedPassword,
            firstName,
            lastName,
            profilePic,
            isAdmin,
          ],
      );

    const user = result.rows[0];
    return user;
  }

  /** Authenticate a user
   *  Requests {username, password}
   *  Returns {username, firstName, lastName, profilePic, isAdmin} 
   *  Throws UnauthorizedError if username doesn't exist or password is wrong
   * */
  static async authenticate(username, password) {
    //find user
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  profile_pic AS "profilePic",
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }
    throw new UnauthorizedError("Invalid username/password");
  }

  /**Get all users.
   * Returns [{ username, first_name, last_name, profile_pic, is_admin }, ...]
   **/
   static async getAll() {
    const result = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  profile_pic  AS "profilePic",
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`,
    );
    return result.rows;
  }

  /** Get user by username
   * Returns { username, first_name, last_name, profile_pic, is_admin, wishlists[]}
   * Throws NotFoundError if user not found.
   **/
  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  profile_pic  AS "profilePic",
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];
    if (!user) throw new NotFoundError(`${username} doesn't exist!`);

    const wishlistRes = await db.query(
      `SELECT w.id, c.category
      FROM user_wishlists w
      INNER JOIN wishlist_categories c ON w.category_id = c.id
      WHERE w.username = $1
      ORDER BY c.category`,
      [username],
    );
    user.wishlists = wishlistRes.rows;

    return user;
  }

  /** Update a user by their username
   * Partial update is allowed
   * Requests { firstName, lastName, password, profilePic}
   * Returns { username, firstName, lastName, profilePic, isAdmin }
   * Throws NotFoundError if not found.
   */
  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
          profilePic: "profile_pic",
        });
    const usernameVarIdx = "$" + (values.length + 1);
    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                profile_pic AS "profilePic"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`${username} doesn't exist!`);
    delete user.password;
    return user;
  }

  /**Delete a user by their username. */
  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`${username} doesn't exist!`);

    return `${username} has been deleted!`
  }



/**Get all active wishlists of a specific user by username.
   * Returns [{ id, wishlist_category, description }, ...]
   **/
 static async getAllWishlists(username) {
  // const existCheck = await userExistCheck();
  // console.log(existCheck);
  // if (!existCheck) throw new NotFoundError(`${username} doesn't exist!`);
  // console.log("got to models");
  const result = await db.query(
        `SELECT w.id, w.username, c.category, c.color_code, w.title, w.description, w.banner_img
         FROM user_wishlists w
         INNER JOIN wishlist_categories c ON w.category_id = c.id
         WHERE w.username = $1
         ORDER BY c.category`,
         [username]
  );

  return result.rows;
}


  /** Create a wishlist for a specific user by username
   *  Requests {username, wishlist_category, description}
   *  Returns {id, username, wishlist_category, description} 
   *  Throws NotFoundError if username or wishlist_category is not found
   * */
   static async createWishlist(username, data) {
    // console.log(username);
    // const existCheck = await userExistCheck();
    // console.log(existCheck);
    // if (!existCheck) throw new NotFoundError(`${username} doesn't exist!`);

    const wishlistCategory = await wishlistCategoryCheck(data.category);
    console.log(wishlistCategory.id);
    if (!wishlistCategory) throw new NotFoundError(`${data.category} doesn't exist!`);

    const userWishlist = await userWishlistExistCheck(username, wishlistCategory.id, data.title);
    console.log(userWishlist);
    if (userWishlist) throw new BadRequestError(`The ${data.title} wishlist already exists for ${username}`);

    const result = await db.query(
          `INSERT INTO user_wishlists
          (username, category_id, title, description, banner_img)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, username, category_id, title, description, banner_img`,
        [
          username,
          wishlistCategory.id,
          data.title,
          data.description,
          data.bannerImg
        ],
    );

  const wishlist = result.rows[0];
  return wishlist;
}

/**Get wishlists by category of a specific user
   * Returns [{ id, useranme, wishlist_category, description, title, banner_img }, ...]
   **/
 static async getWishlistsByCategory(username, wishlistCategory) {
  // const existCheck = await userExistCheck();
  // if (!existCheck) throw new NotFoundError(`${username} doesn't exist!`);

  const wishlistCategoryFound = await wishlistCategoryCheck(wishlistCategory);
  if (!wishlistCategoryFound) throw new NotFoundError(`${wishlistCategory} doesn't exist!`);

  const result = await db.query(
        `SELECT w.id, w.username, c.category, c.color_code, w.description, w.title, w.banner_img
         FROM user_wishlists w
         INNER JOIN wishlist_categories c ON w.category_id = c.id
         WHERE w.username = $1 AND w.category_id = $2`,
         [username, wishlistCategoryFound.id]
  );

  const userWishlists = result.rows;
  if (!userWishlists) throw new NotFoundError(`${username} doesn't have a ${wishlistCategory} wishlist!`);

  return userWishlists;
}


/**Get a specific wishlist by category and title of a specific user
   * Returns{ id, useranme, wishlist_category, description, title, banner_img, items:[] }
   **/
static async getWishlistByTitle(username, wishlistCategory, wishlistTitle) {
  // const existCheck = await userExistCheck();
  // if (!existCheck) throw new NotFoundError(`${username} doesn't exist!`);
  const wishlistCategoryFound = await wishlistCategoryCheck(wishlistCategory);
  if (!wishlistCategoryFound) throw new NotFoundError(`${wishlistCategory} doesn't exist!`);

  const result = await db.query(
        `SELECT w.id, w.username, c.category, c.color_code, w.description, w.title, w.banner_img
         FROM user_wishlists w
         INNER JOIN wishlist_categories c ON w.category_id = c.id
         WHERE w.username = $1 AND w.category_id = $2 AND w.title = $3`,
         [username, wishlistCategoryFound.id, wishlistTitle]
  );

  const userWishlist = result.rows[0];
  if (!userWishlist) throw new NotFoundError(`${wishlistTitle} doesn't exist for ${username} in the ${wishlistCategory} category`);
  
  const itemRes = await db.query(
    `SELECT uwi.item_id AS id, i.name, c.category, c.color_code, i.description, i.link, i.image_link, i.price
    FROM user_wishlist_items uwi
    INNER JOIN items i ON uwi.item_id = i.id
    INNER JOIN item_categories c ON i.category_id = c.id
    WHERE uwi.wishlist_id = $1
    ORDER BY i.name`,
    [userWishlist.id],
  );

  userWishlist.items = itemRes.rows;

  return userWishlist;
}


/**Delete a wishlist of a user by username
 * TThrows NotFoundError if username or wishlist is not found
 **/
static async removeWishlist(username, wishlistCategory, wishlistTitle) {

  const wishlistCategoryId = await wishlistCategoryCheck(wishlistCategory);
  if (!wishlistCategoryId) throw new NotFoundError(`The category ${wishlistCategory} doesn't exist!`);

  const foundWishlist = await userWishlistExistCheck(username, wishlistCategoryId.id, wishlistTitle);
  if (!foundWishlist) throw new NotFoundError(`The wishlist ${wishlistTitle} doesn't exist!`);

  await db.query(
        `DELETE FROM user_wishlists
         WHERE id = $1
         RETURNING id`,
      [foundWishlist.id]
  );

  return `${wishlistTitle} has been deleted!`;
}

  /** Update a user by their username
   * Partial update is allowed
   * Requests { firstName, lastName, password, profilePic}
   * Returns { username, firstName, lastName, profilePic, isAdmin }
   * Throws NotFoundError if not found.
   */
   static async addItemToWishlist(username, category, title, itemId) {
    console.log(`from API: ${itemId}`)
    console.log(`from API: ${username}`)
    console.log(`from API: ${category}`)
    console.log(`from API: ${title}`)

    const itemRes = await db.query(
      `SELECT id 
      FROM items
      WHERE id = $1`, [itemId]
    );

    const item = itemRes.rows[0];
    if(!item) throw new NotFoundError(`The ${itemData} doesn't exist!`);

    const wishlistRes = await db.query(
      `SELECT id, username, title
      FROM user_wishlists
      WHERE username = $1 AND title= $2`,
      [username, title]
    )

    const wishlist = wishlistRes.rows[0];

    const result = await db.query(
      `INSERT INTO user_wishlist_items
      (item_id, wishlist_id)
      VALUES ($1, $2)
      RETURNING item_id`, [item.id, wishlist.id]
    )

    const addedItem = result.rows[0];

    return `added item ${addedItem}`;
  }

  /**Delete an item from a specific wishlist
 * Throws NotFoundError if wishlistCategory, wishlist, or item is not found
 **/
static async removeItemFromWishlist(username, wishlistCategory, wishlistTitle, itemId) {
  const foundUser = await userExistCheck(username);
  if (!foundUser) throw new NotFoundError(`${username} doesn't exists`);

  const wishlistCategoryId = await wishlistCategoryCheck(wishlistCategory);
  if (!wishlistCategoryId) throw new NotFoundError(`The category ${wishlistCategory} doesn't exist!`);

  const foundWishlist = await userWishlistExistCheck(username, wishlistCategoryId.id, wishlistTitle);
  if (!foundWishlist) throw new NotFoundError(`The wishlist ${wishlistTitle} doesn't exist!`);

  const foundItem = await itemInWishlistCheck(itemId, foundWishlist.id);
  if (!foundItem) throw new NotFoundError(`The item is not in ${wishlistTitle}`);

  await db.query(
        `DELETE FROM user_wishlist_items
         WHERE item_id = $1
         RETURNING wishlist_id`,
      [itemId]
  );

  return `The item has been deleted from ${wishlistTitle}`;
}

}

module.exports = User;