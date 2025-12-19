const Movie = require('../models/Movie.models');

exports.getMovies = async (req, res) => {
    const { page = 1, limit = 10, genre, year } = req.query;
    const filter = {};

    if (genre) filter.genre = genre;
    if (year) filter.releaseYear = year;

    try {
        const movies = await Movie.find(filter)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};



exports.addMovie = async (req, res) => {
    const { title, genre, releaseYear, director, cast, synopsis, posterUrl } = req.body;

    try {
        const movie = new Movie({
            title,
            genre,
            releaseYear,
            director,
            cast,
            synopsis,
            posterUrl
        });

        await movie.save();
        res.status(201).json({ message: 'Movie added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
