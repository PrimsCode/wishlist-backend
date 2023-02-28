"use strict";

const db = require("../db");
const {wishlistCategoryCheck} = require("../helpers/checks");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

class Wishlist {
    /**Get all active wishlists
   * Returns [{id, username, wishlist_category, description}, ...]
   **/
     static async getAll({title, category, orderBy}) {

      let query = `SELECT w.id, w.username, u.profile_pic, c.category, c.color_code, w.title, w.description, w.banner_img
             FROM user_wishlists w
             INNER JOIN users u ON w.username = u.username
             INNER JOIN wishlist_categories c ON w.category_id = c.id`;

      let queryValues = [];
      let whereExpressions = [];
      let order = " ORDER BY "
      let type = "w.title"
  
      if (title) {
        queryValues.push(`%${title}%`);
        whereExpressions.push(`w.title ILIKE $${queryValues.length}`);
      }
  
      if(category) {
        queryValues.push(category);
        whereExpressions.push(`c.category = $${queryValues.length}`)
      }
  
      if (whereExpressions.length > 0) {
        query += " WHERE " + whereExpressions.join(" AND ");
      }
  
      if(orderBy === "username") type = "w.username"
      
      order += type;
      query += order;
  
      const wishlistsRes = await  db.query(query, queryValues);
      return wishlistsRes.rows;
    }
  
    /**Get all wishlist cateogies
   * Returns [{id, category}, ...]
   **/
     static async getAllCategories() {
      const result = await db.query(
            `SELECT *
             FROM wishlist_categories
             ORDER BY category`,
      );
      return result.rows;
    }

    /**POST create a new wishlist category
     * Requests {category}
   * Returns {id, category}
   * Throws BadRequestError if category already exists
   **/
     static async createNewCategory(category, colorCode) {
      const categoryCheck = await wishlistCategoryCheck(category);
      if (categoryCheck) throw new BadRequestError(`${category} arleady exists!`);
      
      const lowerCaseCategory = category.toLowerCase();

      const result = await db.query(
            `INSERT INTO wishlist_categories
            (category, color_code)
            VALUES ($1, $2)
            RETURNING id, category, color_code`,
            [lowerCaseCategory, colorCode]
      );
      return result.rows[0];
    }

    /**Get all wishlists of a specific category
   * Returns [{id, username, wishlsit_category, description}, ...]
   * Throws NotFoundError if category does not exist
   **/
       static async getAllWishlistsOfCategory(category) {
        const categoryCheck = await wishlistCategoryCheck(category);
        if (!categoryCheck) throw new NotFoundError(`${category} does not exist!`);

        const lowerCaseCategory = category.toLowerCase();

        const result = await db.query(
              `SELECT w.id, w.username, c.category, w.title, w.description, w.banner_img
               FROM user_wishlists w
               INNER JOIN wishlist_categories c ON c.id = w.category_id
               WHERE c.category = $1
               ORDER BY category`, 
               [lowerCaseCategory]
        );
        return result.rows;
      }

      /**DELETE a wishlist category
       *Throws NotFoundError if category does not exist
      **/
         static async removeWishlistCategory(category) {
          const lowerCaseCategory = category.toLowerCase()
  
          const result = await db.query(
                `DELETE
                 FROM wishlist_categories
                 WHERE category = $1`, 
                 [lowerCaseCategory]
          );
          const wishlistCategory = result.rows[0];
          if (!wishlistCategory) throw new NotFoundError(`${category} doesn't exist!`);
          return `${category} has been deleted!`
        }
}

module.exports = Wishlist;