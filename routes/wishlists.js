"use strict";

/** Routes for users. */
const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const Wishlist = require("../models/wishlist");
const CategoryNewSchema = require("../schemas/categoryNew.json");

const router = express.Router();

/** GET all wishlists in the database
   * Returns array of all wishlists.
   **/
 router.get("/", async function (req, res, next) {
    try {
      const q = req.query;
      const wishlists = await Wishlist.getAll(q);
      return res.json({ wishlists });
    } catch (err) {
      return next(err);
    }
  });

  /** POST a new wishlist category
   * Request {category}
   * Returns {id, category}
   * Authorization required: Logged in
   **/
 router.post("/categories", ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, CategoryNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      const category = await Wishlist.createNewCategory(req.body.category);
      return res.json({ category });
    } catch (err) {
      return next(err);
    }
  });

    /** GET all wishlist categories
   * Returns array of all wishlist categories.
   **/
 router.get("/categories", async function (req, res, next) {
    try {
      const categories = await Wishlist.getAllCategories();
      return res.json({ categories });
    } catch (err) {
      return next(err);
    }
  });
  
  
  /** GET wishlists by category
   * Returns an array of wishlists
   **/
  router.get("/categories/:category", async function (req, res, next) {
    try {
      const wishlists = await Wishlist.getAllWishlistsOfCategory(req.params.category);
      return res.json({ wishlists });
    } catch (err) {
      return next(err);
    }
  });

    /** DELETE a wishlist category**/
     router.delete("/categories/:category", ensureAdmin, async function (req, res, next) {
        try {
          await Wishlist.removeWishlistCategory(req.params.category);
          return res.json({ deleted: req.params.category });
        } catch (err) {
          return next(err);
        }
      });


  module.exports = router;