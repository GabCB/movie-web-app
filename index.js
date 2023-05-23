/**
* root file of the myFlix back end application
* importing packages required for the project
* @requires express
* @requires bodyParser
* @requires fs
* @requires path
* @requires uuid
* @requires morgan
* @requires CORS
* @requires ./auth
* @requires ./passport
* @requires mongoose
* @requires ./models.js
* @requires express-validator
*/
const express = require("express"),
    app = express(),
    morgan =require("morgan"),
    bodyParser = require("body-parser"),
    uuid = require ("uuid"),
    fs = require("fs"),
    path = require ("path"),
    mongoose = require("mongoose"),
    Models = require("./models.js"),
    { check, validationResult } = require("express-validator"),
    Movies = Models.Movie,
    Users = Models.User;
    //Genres = Models.Genre,
    //Directors = Models.Director;

//Allows Mongoose to connect to the database so it can perform CRUD operations on the documents it contains from within the REST API.
/*mongoose.connect("mongodb://127.0.0.1:27017/cfDB", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});*/
mongoose.set('strictQuery', false);
/**
* connection to online database hosted by mongoDB
*/
mongoose.connect(process.env.CONNECTION_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

const cors = require("cors");
let allowedOrigins = ["http://localhost:8080", "http://localhost:1234", "https://moviewebapp.herokuapp.com/"];

app.use(cors());

let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

 //log requests to server
 app.use(express.static("public"));
 //creates a txt log file, recording any requests made to the API
 app.use(morgan("common", {stream: accessLogStream}));

// * @summary Express GET route located at the endpoint “/” that returns a default textual response
// * @return {object} 200 - success response - application/json

/**
* Welcome page text response
* @function
* @method GET - endpoint '/'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - HTTP response object with the welcome message
*/
app.get("/", (req, res) => {
    res.send("Welcome to the My Flix Movie App!");
});

/**
* GET the API documentation at the "/documentation" endpoint
* @function
* @method GET - endpoint '/documentation'
* @returns the contents of documentation.html
*/
app.get("/documentation", (req, res) => {
    res.sendFile("public/documentation.html", { root: __dirname });
});

/**
* Allows users to register by filling out required information
* @function
* @method POST - endpoint '/users'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - JSON object holding data of the new user
*/
app.post("/users",
    //Validation logic here for request you can either usea a chain method like .not().isEmpty()
    //which means "oposite of isEmpty" in plain english "is not empty"
    //or use .isLength({min:5}) which means minimun value of 5 characters is allowed
    [
        check("Username", "Username is required").isLength({min: 5}),
        check("Username", "Username contains non alphanumeric characters -  not allowed.").isAlphanumeric(),
        check("Password", "Password is required").not().isEmpty(),
        check("Email", "Email does not appear to be valid").isEmail()
], (req, res) => {
    //check the validation object for errors
    let errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array()
        });
    }
    
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })//Search to see is a user with the requested username already exists
    .then((user) => {
        if(user) { //If the user is found, send a response that it already exists
            return res.status(400).send(req.body.username + " already exists");
        }else {
        Users
            .create({
                // req.body is data input by user, the keys (eg Email) correlate to a field in models.js
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday,
            })
            .then((user) => {
            res.status(201).json(user);
            })
            .catch((error) => {
                console.error(error);
             res.status(500).send("Error: " + error);
            });
        }
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
    });
});

/**
* Retreives all registered users
* @function
* @method GET - endpoint '/users'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - HTTP response object with a list of users 
*/
app.get("/users", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.find()
    .then((users) => {
        res.status(201).json(users);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: "+ err);
    });
});
 
/**
* Retrieves a specific user by their Name
* @function
* @method GET - endpoint '/users/:Username'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - JSON object holding data of the user
*/
app.get("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
    .then ((user) => {
        res.json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: "+ err);
    });
});

/**
* Allows existing user to update their information
* @function
* @method PUT - endpoint '/users/:Username'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - JSON object holding updated data of the user
*/
app.put("/users/:Username",
[
    check("Username", "Username is required").isLength({min: 5}),
    check("Username", "Username contains non alphanumeric characters -  not allowed.").isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
], passport.authenticate("jwt", { session: false }), (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate({ Username: req.params.Username}, { $set: 
        {
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
        }
    },
    { new: true }, //This line makes sure the updated doc is returned
    (err, updatedUser) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        } else {
            res.json(updatedUser);
        }
    });
});

/**
* Allows registered users to add a movie to their favorites
* @function
* @method POST - endpoint '/users/:Username/movies/:MovieID'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - JSON object holding updated data of the user
*/
app.post("/users/:Username/movies/:MovieID", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
            $push: { FavoriteMovies: req.params.MovieID }
        },
        { new: true }, //This line makes sure that the updated document is returned
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error: "+ err);
            } else {
                res.status(200).json(updatedUser);
            }
        }
    );
});

/**
* Allows a registered user to delete their account
* @function
* @method DELETE - endpoint '/users/:Username'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {string} - message confirming account deletion
*/
app.delete("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndRemove ({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + " was not found");
            } else {
                res.status(200).send(req.params.Username + " was deleted.");
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: "+ err);
    });
});

/**
* Allows registered users to remove a movie from their favorites
* @function
* @method DELETE - endpoint '/users/:Username/movies/:MovieID'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - JSON object holding updated data of the user
*/
app.delete("/users/:Username/movies/:MoviesID", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
            $pull: { FavoriteMovies: req.params.MoviesID }
        },
        { new: true }, //This line makes sure the updated doc is returned
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error: " + err);
            } else {
                res.json(updatedUser);
            }
    });
});

/**
* Retrieves a list of all movies
* @function
* @method GET - endpoint '/movies'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - HTTP response object with the list of movies
*/
app.get("/movies", passport.authenticate("jwt", { session: false }),(req, res) => {
    Movies.find()
    .then((movies) => {
        res.status(201).json(movies);   
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: "+ err);
    });
});

/**
* Retrieves a specific movie by its' title
* @function
* @method GET - endpoint '/movies/:Title'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - HTTP response object with the info of one movie
*/
app.get("/movies/:Title", passport.authenticate("jwt", { session: false }), (req, res) => {
   Movies.findOne({ Title: req.params.Title })
   .then((movie) => {
        res.json(movie);
   })
   .catch((err) => {
    console.error(err);
    res.status(500).send("Error: "+ err);
   });
});

/**
* Retrieves a specific Genre by its' title
* @function
* @method GET - endpoint '/movies/genre/:genreName'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - HTTP response object with info of one genre
*/
app.get("/movies/genre/:genreName", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.genreName })
    .then((movie) => {
        res.json(movie.Genre);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: "+ err);
    });
 });

/**
* Retrieves a specific Director by their Name
* @function
* @method GET - endpoint '/movies/directors/:directorName'
* @param {object} - HTTP request object
* @param {object} - HTTP response object
* @returns {object} - HTTP response object with info of one director
*/
 app.get("/movies/directors/:directorName", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ "Director.Name": req.params.directorName })
    .then((movie) => {
        res.json(movie.Director);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
 });

//Handling Errors: error handler middleware function, place after all route calls
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something is not quite right. Give it another try.");
});

//starts server on specified port and listens for requests
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
    console.log("Listening on Port " + port);
});
