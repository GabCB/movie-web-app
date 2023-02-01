const express = require('express');
const app = express();

let topMovies = [
    {
        title: "Fantastic Beasts: The Crimes of Grindelwald",
        director: "David Yates",
    },
    {
        title: "News of the world",
        director: "Paul Greengrass",
    },
    {
        title: "Man on fire",
        director: "Tony Scott",
    },
    {
        title: "The danish girl",
        director: "Tom Hooper",
    },
    {
        title: "Dune",
        director: "Chris Columbus",
    },
    {
        title: "Radioactive",
        director: "Marjane Satrapi",
    },
    {
        title: "The Laundromat",
        director: "Steven Soderbergh",
    },
    {
        title: "Hampstead",
        director: "Joel Hopkins",
    },
    {
        title: "The two popes",
        director: "ernando Meirelles",
    },
    {
        title: "Don't look up",
        director: "Adam McKay",
    },
    
];

//GET requests
app.get('/', (req, res) => {
    res.send('Welcome to the Movie App!');
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', { root: __dirname});
});

//listen for requests
app.listen(8080, () => {
    console.log('This app is listening on port 8080.');
});

