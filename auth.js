// This has to be the same key used in the JWTStrategy
const jwtSecret = "your_jwt_secret";

const jwt = require("jsonwebtoken"),
    passport = require("passport");
// Your local passport file
require("./passport"); 

/**
* Allows a JWT token to be generated from user data
* @param {object} user in which JWT should be generated for
* @returns {string} - generated JWT token
*/
let generateJWTToken = (user) => {
    const userObj = {
        Username: user.Username
    }
    return jwt.sign(userObj, jwtSecret, {
        subject: user.Username, //This is the username you're encoding in the JWT
        expiresIn: "7d", //This specifies that the token will expire  in 7 days
        algorithm: "HS256" //This is the algorithm used to "sign" or encode the values of the JWT
    });
}

/**
* /login endpoint for exisiting users implemented by POST method
* authentication provided by passport
* JWT token is implemented upon successful authentication
* @param {object} router - provided by Express router
* @returns {object} - JOSN object holding user data and token
*/
module.exports = (router) => {
    router.post("/login", (req, res) => {
        passport.authenticate("local", { session: false }, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({
                    message: "There is a problem with your log in", 
                    user: user
                });
            }
            req.login(user, { session: false }, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });
            });
        })(req, res);
    });
}