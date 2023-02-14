const express = require('express'),
    app = express(),
    morgan =require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require ('uuid');
    mongoose = require('mongoose');
    Models = require('./models.js');
    Movies = Models.Movie;
    Users = Models.User;
    
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/moviesappMongoDB', { useNewUrlPrser: true, useUnifiedTopology: true });

let movies = [
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
    
    
];

let users = [
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
];
    

//CREATE
app.post('/users', (req, res) => {
    const newUser = req.body;

    if (newUser.name) {
        newUser.id= uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser)
    } else {
        res.status(400).send('users need name')
    }
})

//UPDATE
app.put('/users/:id', (req, res) => {
    const { id } =req.params;
    const updatedUser = req.body;

    let user = users.find( user => user.id == id );

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('no such user')
    }
})

//CREATE
app.post('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } =req.params;
    

    let user = users.find( user => user.id == id );

    if (user) {
        user.favoriteMovie.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);
    } else {
        res.status(400).send('no such user')
    }
})

//DELETE
app.delete('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } =req.params;
    

    let user = users.find( user => user.id == id );

    if (user) {
        user.favoriteMovie = user.favoriteMovie.filter( title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user ${id}'s array`);
    } else {
        res.status(400).send('no such user')
    }
})

//DELETE
app.delete('/users/:id', (req, res) => {
    const { id } =req.params;
    

    let user = users.find( user => user.id == id );

    if (user) {
        users = users.filter( user => user.id != id);
        //res.json(users)
        res.status(200).send(`user ${id} has been deleted`);
    } else {
        res.status(400).send('no such user')
    }
})

//READ (GET requests)
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
})

app.get('/movies/:title', (req, res) => {
   const { title } =req.params;
   const movie = movies.find( movie => movie.title === title);

   if (movie) {
    res.status(200).json(movie);
   } else {
    res.status(400).send('no such movie')
   }
})

app.get('/movies/genre/:genreName', (req, res) => {
    const { genreName } =req.params;
    const genre = movies.find( movie => movie.genre === genreName).genre;
 
    if (genre) {
     res.status(200).json(genre);
    } else {
     res.status(400).send('no such genre')
    }
 })

 app.get('/movies/directors/:directorName', (req, res) => {
    const { directorName } =req.params;
    const director = movies.find( movie => movie.director.name === directorName).director;
 
    if (director) {
     res.status(200).json(director);
    } else {
     res.status(400).send('no such director')
    }
 })

 app.use(express.static('public'));
app.use(morgan('common'));

//GET requests
app.get('/', (req, res) => {
    res.send('Welcome to the Movie App!');
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', { root: __dirname });
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
});

//Handling Errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Oh, something went worng. Please try again later.");
});

//listen for requests
app.listen(8080, () => {
    console.log('This app is listening on port 8080.');
});

