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

// import swagger tools for documentation
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

/*mongoose.connect("mongodb://127.0.0.1:27017/cfDB", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});*/
mongoose.set('strictQuery', false);
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
 app.use(morgan("common", {stream: accessLogStream}));

// Swagger options. Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
    swaggerDefinition: {
      info: {
        version: '1.0.0',
        title: 'movie web app API',
        description: 'Movie API',
        contact: {
          name: 'Gabriela Cuencas B.'
        },
        servers: [
          {
            'url': 'http://localhost:8080',
            'description': 'Local server'
          },
          {
            'url': 'https://moviewebapp.herokuapp.com',
            'description': 'Production server'
          }
        ]
      }
    },
    // ['.routes/*.js']
    apis: ['index.js']
  };
  
  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  // Create endpoint for documentation
  app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  
  
  // Routes
  /**
   * @swagger
   * /:
   *  get:
   *    summary: Welcome page
   *    tags: [Welcome]
   *    responses:
   *      200:
   *        description: A successful response
   */

//homepage text response
app.get("/", (req, res) => {
    res.status(200).send("Welcome to my movie web app API!");
});

//app.get("/documentation", (req, res) => {
    /*res.sendFile("public/documentation.html", { root: __dirname });
});*/

//CREATE a new user
/** 
 * @swagger
 * /users:
 *   post:
 *     summary: Add a user (register)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: The user was successfully created
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

//READ (GET all users)
/**
 * @swagger
 * /users:
 *    get:
 *      summary: Get all users
 *      tags: [Users]
 *    responses:
 *      200:
 *        description: A successful response
 */
app.get("/users", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.find()
    .then((users) => {
        res.status(200).json(users);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: "+ err);
    });
});
 
//READ (GET a user by username)
/**
 * @swagger
 * /users/{Username}:
 *    get:
 *      summary: Get a user by username
 *      tags: [Users]
 *    parameters:
 *      - name: Username
 *        description: User username
 *        schema:
 *          type: string
 *          format: string
 *    responses:
 *      '200':
 *        description: A successful response
 */
app.get("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
    .then ((user) => {
        res.status(200).json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: "+ err);
    });
});

//UPDATE a user's info by username
/**
 * @swagger
 * /users/{Username}:
 *  put:
 *    summary: Update a user's info, by username
 *    tags: [Users]
 *    parameters:
 *      - in: path
 *        name: Username
 *        schema:
 *          type: string
 *        required: true
 *        description: The user's username
 *    requestBody:
 *      required: true
 *    responses:
 *      200:
 *        description: The user was updated
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
            res.status(200).json(updatedUser);
        }
    });
});

//UPDATE favorite movie by username and movie title
/**
 * @swagger
 * /users/{Username}/movies/{MovieID}:
 *   post:
 *     summary: Add a movie to a user's list of favorites by id
 *     tags: [Users]
 *     parameters:
 *       - name: Username
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's username
 *       - name: MovieID
 *         required: true
 *         description: The movie ID
 * 
 *     responses:
 *       201:
 *         description: The movie was added
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
                res.status(201).json(updatedUser);
            }
        }
    );
});

//DELETE a user by username
/**
 * @swagger
 * /users/{Username}:
 *   delete:
 *     summary: Delete a user by username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: Username
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's username
 * 
 *     responses:
 *       202:
 *         description: The user was deleted
 */
app.delete("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndRemove ({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + " was not found");
            } else {
                res.status(202).send(req.params.Username + " was deleted.");
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: "+ err);
    });
});

//DELETE a movie from user's list of favorites
/**
 * @swagger
 * /users/{Username}/movies/{MovieID}:
 *   delete:
 *     summary: Remove a movie from a user's list of favorites by id
 *     tags: [Users]
 *     parameters:
 *       - name: Username
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's username
 *       - name: MovieID
 *         required: true
 *         description: The movie ID
 *     responses:
 *       202:
 *         description: The movie was deleted
 */
app.delete("/users/:Username/movies/:MovieID", passport.authenticate("jwt", { session: false }), (req, res) => {
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
                res.status(202).json(updatedUser);
            }
    });
});

//READ (GET all movies)
/**
 * @swagger
 * /movies:
 *    get:
 *      summary: Get list of all movies
 *      tags: [Movies]
 *      responses:
 *         200:
 *            description: A successful response
 *            content: 
 *               application/json
 */
app.get("/movies", (req, res) => {
    Movies.find()
    .then((movies) => {
        res.status(201).json(movies);   
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: "+ err);
    });
});

//READ (GET a movie by title)
/**
 * @swagger
 * /movies/{Title}:
 *    get:
 *      summary: Get data about a single movie by title
 *      tags: [Movies]
 *      parameters:
 *          - name: Title
 *            description: Title of movie
 *            schema:
 *              type: string
 *      responses:
 *           200:
 *               description: A successful response
 */
app.get("/movies/:Title", passport.authenticate("jwt", { session: false }), (req, res) => {
   Movies.findOne({ Title: req.params.Title })
   .then((movie) => {
        res.status(200).json(movie);
   })
   .catch((err) => {
    console.error(err);
    res.status(500).send("Error: "+ err);
   });
});

//READ (GET data about a genre by name)
/**
 * @swagger
 * /movies/genre/{genreName}:
 *    get:
 *      summary: Return data about a genre (description) by name
 *      tags: [Movies]
 *    parameters:
 *      - name: Name
 *        description: Name of genre
 *        schema:
 *          type: string
 *          format: string
 *    responses:
 *      200:
 *        description: A successful response
 */
app.get("/movies/genre/:genreName", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.genreName })
    .then((movie) => {
        res.status(200).json(movie.Genre);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Error: "+ err);
    });
 });

 //READ (GET a movie dy director)
 /**
 * @swagger
 * /movies/directors/{directorName}:
 *    get:
 *      summary: Return data about a movie by director
 *      tags: [Movies]
 *    parameters:
 *      - name: Name
 *        description: Name of director
 *        schema:
 *          type: string
 *          format: string
 *    responses:
 *      200:
 *        description: A successful response
 */
 app.get("/movies/directors/:directorName", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ "Director.Name": req.params.directorName })
    .then((movie) => {
        res.status(200).json(movie.Director);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
 });

//Handling Errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something is not quite right. Give it another try.");
});

//Listen for requests
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
    console.log("Listening on Port " + port);
});
