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

/*mongoose.connect("mongodb://127.0.0.1:27017/cfDB", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});*/
mongoose.connect(process.env.CONNECTION_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

const cors = require("cors");
let allowedOrigins = ["http://localhost:8080", "https://moviewebapp.herokuapp.com/"];

app.use(cors({
    origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){//If a specific origin isn't found on the list of allowed origins
        let message ="The CORS policy for this application doesn't allow access from origin " + origin;
        return callback(new Error(message ), false);
    }
    return callback(null, true);
    }
}));

let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

 //log requests to server
 app.use(express.static("public"));
 app.use(morgan("common", {stream: accessLogStream}));

//homepage text response
app.get("/", (req, res) => {
    res.send("Welcome to the Movie App!");
});

app.get("/documentation", (req, res) => {
    res.sendFile("public/documentation.html", { root: __dirname });
});

//CREATE a new user
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
 
//READ (GET a user by username)
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

//UPDATE a user's info by username
app.put("/users/:Username", 
[
    check("Username", "Username is required").isLength({min: 5}),
    check("Username", "Username contains non alphanumeric characters -  not allowed.").isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
    passport.authenticate("jwt", { session: false }),
], (req, res) => {
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
        },
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

//UPDATE favorite movie by username and movie title
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

//DELETE a user by username
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

//DELETE a movie from user's list of favorites
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

//READ (GET all movies)
app.get("/movies", passport.authenticate("jwt", { session: false }), (req, res) => {
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

//READ (GET genre by name)
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

 //READ (GET a movie dy director)
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

//Handling Errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Oh, something went worng. Please try again later.");
});

//Listen for requests
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
    console.log("Listening on Port " + port);
});
