const db = require("../db");

//checks if a user exists
const userExistCheck = async(username) => {
    const user = await db.query(
        `SELECT username
        FROM users
        WHERE username = $1`, [username],
      );
    if (user.rows[0]) return true;
    return false;
  }

//checks if an item exists by name  
const itemExistCheck = async(name, link) => {
    const item = await db.query(
        `SELECT id, name
        FROM items
        WHERE name = $1 AND link = $2`, [name, link],
      );
    if (item.rows[0] != undefined) return true;
    return false;
  }

  //checks if an item exists by id  
const itemExistCheckById = async(id) => {
  const item = await db.query(
      `SELECT id, name
      FROM items
      WHERE id = $1`, [id],
    );
  if (item.rows[0] != undefined) return true;
  return false;
}

//checks if an item category exists
const itemCategoryCheck = async(category) => {
  const lowerCaseCategory = category.toLowerCase(); 
    const itemCategory = await db.query(
        `SELECT id, category, color_code
        FROM item_categories
        WHERE category = $1`, [lowerCaseCategory],
      );
    if (itemCategory.rows[0]) return itemCategory.rows[0];
    return false;
  }

  //checks if a wishlist category exists
  const wishlistCategoryCheck = async(category) => {
    const lowerCaseCategory = category.toLowerCase(); 
      const wishlistCategory = await db.query(
          `SELECT id, category
          FROM wishlist_categories
          WHERE category = $1`, [lowerCaseCategory],
        );
      if (wishlistCategory.rows[0]) return wishlistCategory.rows[0];
      return false;
    }
    
  //checks if a wishlist exists
  const userWishlistExistCheck = async(username, categoryId, title) => {

      const userWishlist = await db.query(
          `SELECT id, username, category_id, title
          FROM user_wishlists
          WHERE username = $1 AND category_id = $2 AND title = $3`, [username, categoryId, title],
        );
      if (userWishlist.rows[0]) return userWishlist.rows[0];
      return false;
    }

      //checks if a wishlist exists
  const itemInWishlistCheck = async(itemId, wishlistId) => {

    const item = await db.query(
        `SELECT item_id, wishlist_id
        FROM user_wishlist_items
        WHERE item_id = $1 AND wishlist_id = $2`, [itemId, wishlistId],
      );
    if (item.rows[0]) return item.rows[0];
    return false;
  }

module.exports = { userExistCheck, itemExistCheck, itemCategoryCheck, wishlistCategoryCheck, userWishlistExistCheck, itemExistCheckById, itemInWishlistCheck };
