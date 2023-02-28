"use strict";

const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {itemExistCheck, itemCategoryCheck} = require("../helpers/checks");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

class Item {
  /**Get all items.
   * Returns [{id, name, price, description, category, link, imageLink}, ...]
   **/
   static async getAll({name, category, orderBy} = {}) {
    let query = 
          `SELECT i.id,
                  i.name,
                  i.price,
                  i.description,
                  i.link,
                  i.image_link,
                  c.category,
                  c.color_code
           FROM items i
           INNER JOIN item_categories c ON c.id = i.category_id`;
    let queryValues = [];
    let whereExpressions = [];
    let order = " ORDER BY "
    let type = "i.name"

    if (name) {
      queryValues.push(`%${name}%`);
      whereExpressions.push(`i.name ILIKE $${queryValues.length}`);
    }

    if(category) {
      queryValues.push(category);
      whereExpressions.push(`c.category = $${queryValues.length}`)
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    if(orderBy === "priceLower") type = "i.price ASC"
    if(orderBy === "priceHigher") type = "i.price DESC"
    
    order += type;
    query += order;

    // query += " ORDER BY i.name";
    const itemsRes = await  db.query(query, queryValues);
    return itemsRes.rows;
  }

  /** Get item by id
   * Returns { id, name, price, description, link, imageLink, category}
   * Throws NotFoundError if item not found.
   **/
  static async get(id) {
    const itemRes = await db.query(
          `SELECT i.id,
                  i.name,
                  i.price,
                  i.description,
                  i.link,
                  i.image_link,
                  c.category,
                  c.color_code
           FROM items i
           INNER JOIN item_categories c ON c.id = i.category_id 
           WHERE i.id = $1`,
        [id],
    );

    const item = itemRes.rows[0];
    if (!item) throw new NotFoundError(`${name} doesn't exist!`);

    const wishlistRes = await db.query(
      `SELECT i.id AS item_id, uwi.wishlist_id, w.title, u.username, u.profile_pic, c.category, c.color_code, w.description, w.banner_img
      FROM items i
      INNER JOIN user_wishlist_items uwi ON uwi.item_id = i.id
      INNER JOIN user_wishlists w ON uwi.wishlist_id = w.id
      INNER JOIN users u ON u.username = w.username
      INNER JOIN wishlist_categories c ON w.category_id = c.id
      WHERE i.id = $1
      ORDER BY w.title`,
      [id],
    );

    item.wishlists = wishlistRes.rows;

    return item;
  }

  /** Post an item
   * Request {id, name, price, description, link, imageLink, category}
   * Returns { id, name}
   * Throws BadRequest if item already exists or fields are null
   **/
  static async createItem({ name, price, description, link, imageLink, category }) {
    const duplicateCheck = await itemExistCheck(name, link);
    if (duplicateCheck) {
      throw new BadRequestError(`${name} already exists`);
    }

  const categoryId = await itemCategoryCheck(category);

  const result = await db.query(
        `INSERT INTO items
         (name, price, description, link, image_link, category_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name`,
      [name, price, description, link, imageLink, categoryId],
  );
  const item = result.rows[0];
  return item;
}

  /** Update an item by id
   * Partial update is allowed
   * Requests { name, price, description, link, imageLink, category}
   * Returns { id, name }
   * Throws NotFoundError if not found.
   */
  static async update(id, data) {
    if (data.category) {
      const categoryId = await itemCategoryCheck(data.category);
      data.categoryId = categoryId;
      delete data.category;
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          name: "name",
          price: "price",
          description: "description",
          link: "link",
          imageLink:"image_link",
          categoryId:"category_id"
        });
        
    const idVarIdx = "$" + (values.length + 1);
    const querySql = `UPDATE items 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, name`;
    const result = await db.query(querySql, [...values, id]);
    const item = result.rows[0];

    if (!item) throw new NotFoundError(`The item doesn't exist!`);
    return item;
  }

  /**Delete an item by its id */
  static async remove(id) {
    let result = await db.query(
          `DELETE
           FROM items
           WHERE id = $1
           RETURNING id, name`,
        [id],
    );
    const item = result.rows[0];

    if (!item) throw new NotFoundError(`The item doesn't exist!`);
    return `${item.name} has been deleted!`
  }


  /**Get all item cateogies
   * Returns [{id, category}, ...]
   **/
   static async getAllCategories() {
    const result = await db.query(
          `SELECT *
           FROM item_categories
           ORDER BY category`,
    );
    return result.rows;
  }

  /**POST create a new item category
   * Requests {category}
 * Returns {id, category}
 * Throws BadRequestError if category already exists
 **/
   static async createNewCategory(category,colorCode) {
    const categoryCheck = await itemCategoryCheck(category);
    if (categoryCheck) throw new BadRequestError(`${category} already exists!`);
    
    const lowerCaseCategory = category.toLowerCase();

    const result = await db.query(
          `INSERT INTO item_categories
          (category, color_code)
          VALUES ($1, $2)
          RETURNING id, category, color_code`,
          [lowerCaseCategory, colorCode]
    );
    return result.rows[0];
  }

  /**Get all items of a specific category
 * Returns [{id, name, item_category, description, link, image_link, price}, ...]
 * Throws NotFoundError if category does not exist
 **/
     static async getAllItemsOfCategory(category) {
      const foundCat = await itemCategoryCheck(category);
      if (!foundCat) throw new NotFoundError(`${category} does not exist!`);

      const res = await db.query(
            `SELECT i.id, c.category, c.color_code, i.name, i.price, i.description, i.link, i.image_link
             FROM items i
             INNER JOIN item_categories c ON c.id = i.category_id
             WHERE c.id = $1`,
             [foundCat.id]
      );

      const items = res.rows;
      if (!items) throw new NotFoundError(`${category} doesn't have any item.`)
  
      return items;
    }

    /**DELETE an item category
     *Throws NotFoundError if category does not exist
    **/
       static async removeItemCategory(category) {
        const lowerCaseCategory = category.toLowerCase()

        const result = await db.query(
              `DELETE
               FROM item_categories
               WHERE category = $1`, 
               [lowerCaseCategory]
        );
        const itemCategory = result.rows[0];
        if (!itemCategory) throw new NotFoundError(`${category} doesn't exist!`);
        return `${category} has been deleted!`
      }




}

module.exports = Item;