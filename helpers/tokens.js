const jwt = require("jsonwebtoken");
const {SECRET_KEY} = require("../config");
const JWT_OPTIONS = {expiresIn: "1d"};

/** Create a token for a user
 *  Returns {token} that expires in one hour
 **/
function createToken(user) {
    let payload = {
        username: user.username,
        isAdmin: user.isAdmin || false
    };
    return jwt.sign(payload, SECRET_KEY, JWT_OPTIONS);
}

module.exports = {createToken};