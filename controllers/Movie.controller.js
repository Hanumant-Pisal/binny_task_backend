const Movie = require('../models/Movie.models');
const QueueService = require('../services/QueueService');

exports.getMovies = async (req, res) => {
    const { page = 1, limit = 10, genre, year, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({ message: 'Invalid page number' });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({ message: 'Invalid limit (must be 1-100)' });
    }
    
    if (year && isNaN(Number(year))) {
        return res.status(400).json({ message: 'Invalid year format' });
    }
    
    const filter = {};
    if (genre) filter.genre = genre;
    if (year) filter.releaseYear = Number(year);

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    try {
        const [movies, totalCount] = await Promise.all([
            Movie.find(filter)
                .sort(sortOptions)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Movie.countDocuments(filter)
        ]);

        res.json({
            movies,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ message: 'Failed to fetch movies' });
    }
};

exports.addMovie = async (req, res) => {
    const { title, genre, releaseYear, director, cast, synopsis, posterUrl } = req.body;
    
    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: 'Title is required and must be a non-empty string' });
    }
    
    if (!genre || typeof genre !== 'string' || genre.trim().length === 0) {
        return res.status(400).json({ message: 'Genre is required and must be a non-empty string' });
    }
    
    if (releaseYear && (isNaN(Number(releaseYear)) || Number(releaseYear) < 1800 || Number(releaseYear) > new Date().getFullYear() + 10)) {
        return res.status(400).json({ message: 'Invalid release year' });
    }
    
    if (director && typeof director !== 'string') {
        return res.status(400).json({ message: 'Director must be a string' });
    }
    
    if (cast && !Array.isArray(cast)) {
        return res.status(400).json({ message: 'Cast must be an array' });
    }
    
    if (posterUrl && typeof posterUrl !== 'string') {
        return res.status(400).json({ message: 'Poster URL must be a string' });
    }

    try {
        const job = await QueueService.addJob('movie_insert', {
            title: title.trim(),
            genre: genre.trim(),
            releaseYear: releaseYear ? Number(releaseYear) : undefined,
            director: director ? director.trim() : undefined,
            cast: cast || [],
            synopsis: synopsis ? synopsis.trim() : undefined,
            posterUrl: posterUrl ? posterUrl.trim() : undefined
        }, 1);

        res.status(202).json({ 
            message: 'Movie addition queued successfully',
            jobId: job._id
        });
    } catch (error) {
        console.error('Error queuing movie addition:', error);
        res.status(500).json({ message: 'Failed to queue movie addition' });
    }
};

exports.updateMovie = async (req, res) => {
    const { id } = req.params;
    const { title, genre, releaseYear, director, cast, synopsis, posterUrl } = req.body;
    
    // ID validation
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Valid movie ID is required' });
    }
    
    // Input validation
    if (title && (typeof title !== 'string' || title.trim().length === 0)) {
        return res.status(400).json({ message: 'Title must be a non-empty string' });
    }
    
    if (genre && (typeof genre !== 'string' || genre.trim().length === 0)) {
        return res.status(400).json({ message: 'Genre must be a non-empty string' });
    }
    
    if (releaseYear && (isNaN(Number(releaseYear)) || Number(releaseYear) < 1800 || Number(releaseYear) > new Date().getFullYear() + 10)) {
        return res.status(400).json({ message: 'Invalid release year' });
    }
    
    if (director && typeof director !== 'string') {
        return res.status(400).json({ message: 'Director must be a string' });
    }
    
    if (cast && !Array.isArray(cast)) {
        return res.status(400).json({ message: 'Cast must be an array' });
    }
    
    if (posterUrl && typeof posterUrl !== 'string') {
        return res.status(400).json({ message: 'Poster URL must be a string' });
    }
    
    // Check if at least one field is being updated
    const updateFields = { title, genre, releaseYear, director, cast, synopsis, posterUrl };
    const hasUpdates = Object.values(updateFields).some(value => value !== undefined);
    
    if (!hasUpdates) {
        return res.status(400).json({ message: 'At least one field must be provided for update' });
    }

    try {
        const job = await QueueService.addJob('movie_update', {
            id,
            title: title ? title.trim() : undefined,
            genre: genre ? genre.trim() : undefined,
            releaseYear: releaseYear ? Number(releaseYear) : undefined,
            director: director ? director.trim() : undefined,
            cast: cast || undefined,
            synopsis: synopsis ? synopsis.trim() : undefined,
            posterUrl: posterUrl ? posterUrl.trim() : undefined
        }, 1);

        res.json({ 
            message: 'Movie update queued successfully',
            jobId: job._id
        });
    } catch (error) {
        console.error('Error queuing movie update:', error);
        res.status(500).json({ message: 'Failed to queue movie update' });
    }
};
