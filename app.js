const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/auth");
const wishlistRoutes = require("./routes/wishlists");
const userRoutes = require("./routes/users");
const itemRoutes = require("./routes/items");
const {NotFoundError} = require("./expressError");
const {authenticateJWT}= require("./middleware/auth");

//middleware
app.use(cors());
app.use(express.json());
app.use(authenticateJWT);

//routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/items", itemRoutes);
app.use("/wishlists", wishlistRoutes);

//Handle 404 errors
app.use(function (req, res, next) {
    return next(new NotFoundError());
  });
  
//Generic error handler
app.use(function (err, req, res, next) {
    if (process.env.NODE_ENV !== "test") console.error(err.stack);
    const status = err.status || 500;
    const message = err.message;
  
    return res.status(status).json({
      error: { message, status },
    });
});

module.exports = app;