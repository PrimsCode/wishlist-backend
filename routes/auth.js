"use strict";

const express = require("express");
const router = express.Router();

const jsonschema = require("jsonschema");
const authLoginSchema = require("../schemas/authLogin.json");
const authRegisterSchema = require("../schemas/authRegister.json");

const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");

/** Routes for auth. */

/** POST /auth/token:  { username, password } => { token }
 * Returns JWT token which can be used to authenticate further requests.
 */
router.post("/login", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, authLoginSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const {username, password} = req.body;
    const user = await User.authenticate(username, password);
    const token = createToken(user);
    return res.json({token});
  } catch (err) {
    return next(err);
  }
})
  
/** POST /auth/register:   { user } => { token }
 * user must include { username, password, firstName, lastName, profilePic }
 * Returns JWT token which can be used to authenticate further requests.
 */
 router.post("/register", async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, authRegisterSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      const newUser = await User.register({ ...req.body, isAdmin: false });
      const token = createToken(newUser);
      return res.status(201).json({ token });
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;