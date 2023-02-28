"use strict";

/** Routes for users. */
const jsonschema = require("jsonschema");
const itemNewSchema = require('../schemas/itemNew.json');
const itemUpdateSchema = require('../schemas/itemUpdate.json');

const express = require("express");
const { ensureCorrectUserOrAdmin, ensureAdmin, ensureLoggedIn} = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const Item = require("../models/item");

const router = express.Router();

  /** POST a new item
   * Returns { id, name, price, description, link, imageLink, category}
   * Authorization required: logged in
   **/
   router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, itemNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      const itemToAdd = await Item.createItem(req.body);
      const newItem = await Item.get(itemToAdd.id);
      return res.json({ newItem });
    } catch (err) {
      return next(err);
    }
  });

/** GET all items in the database
   * Returns list of all items.
   **/
 router.get("/", async function (req, res, next) {
    try {
      const q = req.query;
      console.log(q)
      const items = await Item.getAll(q);
      return res.json({ items });
    } catch (err) {
      return next(err);
    }
  });

  
    /** GET all item categories
   * Returns { id, name, price, description, link, imageLink, category}
   **/
     router.get("/categories", async function (req, res, next) {
      try {
        const categories = await Item.getAllCategories();
        return res.json({ categories });
      } catch (err) {
        return next(err);
      }
    });
  
    
    /** GET item by id
     * Returns { id, name, price, description, link, imageLink, category}
     **/
    router.get("/:id", async function (req, res, next) {
      try {
        const item = await Item.get(req.params.id);
        return res.json({ item });
      } catch (err) {
        return next(err);
      }
    });


  /** PATCH item by id
   * Data can include: { name, price, description, link, imageLink, category}
   * Returns { id, name, price, description, link, imageLink, category}
   * Authorization required: admin
   **/
   router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, itemUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      const item = await Item.update(req.params.id, req.body);
      const newItem = await Item.get(item.id);
      return res.json({ newItem });
    } catch (err) {
      return next(err);
    }
  });
  
  
  /** DELETE item by id
   * Authorization required: admin
   **/
  router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
      await Item.remove(req.params.id);
      return res.json({ deleted: `item with id ${req.params.id}` });
    } catch (err) {
      return next(err);
    }
  });


  /** GET all item categories
   * Returns { id, name, price, description, link, imageLink, category}
   **/
    router.get("/categories/:category", async function (req, res, next) {
        try {
          const items = await Item.getAllItemsOfCategory(req.params.category)
          return res.json({ items });
        } catch (err) {
          return next(err);
        }
      });




  

  module.exports = router;