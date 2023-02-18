const express = require("express"),
    app = express(),
    morgan =require("morgan"),
    bodyParser = require("body-parser"),
    uuid = require ("uuid"),
    fs = require("fs"),
    path = require ("path"),
    mongoose = require("mongoose"),
    Models = require("./models.js"),
    Movies = Models.Movie,
    Users = Models.User;
    //Genres = Models.Genre,
    //Directors = Models.Director;

mongoose.connect("mongodb://127.0.0.1:27017/cfDB", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

 //log requests to server
 app.use(express.static("public"));
 app.use(morgan("common", {stream: accessLogStream}));


/*let movies = [
    {
        "title": "Fantastic Beasts: The Crimes of Grindelwald",
        "description": "placeholder description",
        "release": "2018",
         "genre": "fantasy",
         "director":  {
        "name": "David Yates",
        "bio": "placeholder bio",
        "birth year": "1963"},
    },
    {
        "title": "News of the world",
        "description": "placeholder description",
        "release": "2020",
         "genre": "drama",
        "director":  {
            "name": "Paul Greengrass",
            "bio": "placeholder bio",
            "birth year": "1955"},
    },
    {
        "title": "Man on fire",
        "description": "placeholder description",
        "release": "2004",
         "genre": "thriller",
        "director":  {
            "name": "Tony Scott",
            "bio": "placeholder bio",
            "birth year": "1944"},
    },
    {
        "title": "The danish girl",
        "description": "placeholder description",
        "release": "2015",
         "genre": "drama",
         "director":  {
            "name": "Tom Hooper",
            "bio": "placeholder bio",
            "birth year": "1972"},
    },
    {
        "title": "Dune",
        "description": "placeholder description",
        "release": "2021",
         "genre": "science-fiction",
         "director":  {
            "name": "Denis Villeneuve",
            "bio": "placeholder bio",
            "birth year": "1967"},
    },
    {
        "title": "Radioactive",
        "description": "placeholder description",
        "release": "2019",
         "genre": "drama",
         "director":  {
            "name": "Marjane Satrapi",
            "bio": "placeholder bio",
            "birth year": "1969"},
    },
    {
        "title": "The Laundromat",
        "description": "placeholder description",
        "release": "2019",
         "genre": "comedy-drama",
         "director":  {
            "name": "Steven Soderbergh",
            "bio": "placeholder bio",
            "birth year": "1963"},
    },
    {
        "title": "Hampstead",
        "description": "placeholder description",
        "release": "2017",
         "genre": "romance",
         "director":  {
            "name": "Joel Hopkins",
            "bio": "placeholder bio",
            "birth year": "1970"},
    },
    {
        "title": "The two popes",
        "description": "placeholder description",
        "release": "2019",
         "genre": "drama",
        "director":  {
            "name": "Fernando Meirelles",
            "bio": "placeholder bio",
            "birth year": "1955"},
    },
    {
        "title": "Don't look up",
        "description": "placeholder description",
        "release": "2021",
         "genre": "science-fiction",
        "director":  {
            "name": "Adam McKay",
            "bio": "placeholder bio",
            "birth year": "1968"},
    },
    
    
];*/

/*let users = [
    {
        "id": "1",
        "name": "Thomas",
        "favoriteMovie": []
      },
      {
        "id": "2",
        "name": "Sophie",
        "favoriteMovie": ["Dune"],
      }
];*/

//homepage text response
app.get("/", (req, res) => {
    res.send("Welcome to the Movie App!");
});

app.get("/documentation", (req, res) => {
    res.sendFile("public/documentation.html", { root: __dirname });
});

//CREATE a new user
app.post("/users", (req, res) => {
    Users.findOne({ Username: req.body.Username })
    .then((user) => {
        if(user) {
            return res.status(400).send(req.body.username + " already exists");
        }else {
        Users
            .create({
                Username: req.body.Username,
                Password: req.body.Password,
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
app.get("/users", (req, res) => {
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
app.get("/users/:Username", (req, res) => {
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
app.put("/users/:Username", (req, res) => {
   Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
        $set: {
            Username: req.body.Username,
            Password: req.body.Password,
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

//UPDATE favorite movie by username and movie title
app.post("/users/:Username/movies/:MovieID", (req, res) => {
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
app.delete("/users/:Username", (req, res) => {
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
app.delete("/users/:Username/movies/:MoviesID", (req, res) => {
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
app.get("/movies/:Title", (req, res) => {
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
app.get("/movies/genre/:genreName", (req, res) => {
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
 app.get("/movies/directors/:directorName", (req, res) => {
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
app.listen(8080, () => {
    console.log('This app is listening on port 8080.');
});
